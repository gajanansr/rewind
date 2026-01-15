package com.rewind.service;

import com.rewind.model.*;
import com.rewind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserQuestionService {

    private final UserQuestionRepository userQuestionRepository;
    private final QuestionRepository questionRepository;
    private final SolutionRepository solutionRepository;
    private final ExplanationRecordingRepository recordingRepository;
    private final UserPatternStatsRepository patternStatsRepository;
    private final ReadinessService readinessService;
    private final RevisionService revisionService;

    /**
     * Start solving a question - marks it as STARTED.
     */
    @Transactional
    public UserQuestion startQuestion(User user, UUID questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        // Check if already exists
        var existing = userQuestionRepository.findByUserIdAndQuestionId(user.getId(), questionId);
        if (existing.isPresent()) {
            UserQuestion uq = existing.get();
            // If already started or completed, just return the existing record
            // This allows users to re-visit/re-solve questions
            if (uq.getStatus() != UserQuestion.Status.NOT_STARTED) {
                return uq;
            }
            uq.start();
            // Update pattern stats
            updatePatternAttempted(user, question.getPattern());
            return userQuestionRepository.save(uq);
        }

        // Create new user_question
        UserQuestion userQuestion = UserQuestion.builder()
                .user(user)
                .question(question)
                .build();
        userQuestion.start();

        // Update pattern stats
        updatePatternAttempted(user, question.getPattern());

        return userQuestionRepository.save(userQuestion);
    }

    /**
     * Submit solution code.
     */
    @Transactional
    public Solution submitSolution(User user, UUID userQuestionId, String code, String language, String leetcodeLink) {
        UserQuestion uq = userQuestionRepository.findById(userQuestionId)
                .orElseThrow(() -> new IllegalArgumentException("UserQuestion not found"));

        // Validate ownership
        if (!uq.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Not authorized");
        }

        // Validate state
        if (uq.getStatus() == UserQuestion.Status.NOT_STARTED) {
            throw new IllegalStateException("Question must be started first");
        }

        Solution solution = Solution.builder()
                .userQuestion(uq)
                .code(code)
                .language(language)
                .leetcodeSubmissionLink(leetcodeLink)
                .build();

        return solutionRepository.save(solution);
    }

    /**
     * Save audio recording and mark question as DONE.
     */
    @Transactional
    public ExplanationRecording saveRecording(
            User user,
            UUID userQuestionId,
            String audioUrl,
            int durationSeconds,
            Integer confidenceScore) {
        UserQuestion uq = userQuestionRepository.findById(userQuestionId)
                .orElseThrow(() -> new IllegalArgumentException("UserQuestion not found"));

        // Validate ownership
        if (!uq.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Not authorized");
        }

        // Must have at least one solution
        if (solutionRepository.findByUserQuestionIdOrderByCreatedAtDesc(userQuestionId).isEmpty()) {
            throw new IllegalStateException("Must submit solution before recording");
        }

        // Determine version
        int version = recordingRepository.findMaxVersionByUserQuestionId(userQuestionId) + 1;

        // Save recording
        ExplanationRecording recording = ExplanationRecording.builder()
                .userQuestion(uq)
                .audioUrl(audioUrl)
                .durationSeconds(durationSeconds)
                .version(version)
                .build();
        recording = recordingRepository.save(recording);

        // Mark as DONE if first recording
        if (uq.getStatus() != UserQuestion.Status.DONE) {
            uq.markDone(confidenceScore);
            userQuestionRepository.save(uq);

            // Update pattern stats
            updatePatternCompleted(user, uq.getQuestion().getPattern(), confidenceScore);

            // Calculate readiness
            readinessService.calculateQuestionCompletion(user, uq);

            // Schedule initial revision
            revisionService.scheduleInitialRevision(user, uq);
        }

        return recording;
    }

    /**
     * Get user's progress on a specific question.
     */
    public UserQuestion getProgress(User user, UUID questionId) {
        return userQuestionRepository.findByUserIdAndQuestionId(user.getId(), questionId)
                .orElse(null);
    }

    private void updatePatternAttempted(User user, Pattern pattern) {
        var stats = patternStatsRepository.findByUserIdAndPatternId(user.getId(), pattern.getId());

        UserPatternStats patternStats = stats.orElseGet(() -> UserPatternStats.builder()
                .user(user)
                .pattern(pattern)
                .build());

        patternStats.incrementAttempted();
        patternStatsRepository.save(patternStats);
    }

    private void updatePatternCompleted(User user, Pattern pattern, Integer confidenceScore) {
        patternStatsRepository.findByUserIdAndPatternId(user.getId(), pattern.getId())
                .ifPresent(stats -> {
                    stats.incrementCompleted(confidenceScore);
                    patternStatsRepository.save(stats);
                });
    }
}
