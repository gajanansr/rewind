package com.rewind.service;

import com.rewind.model.*;
import com.rewind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RevisionService {

    private final UserQuestionRepository userQuestionRepository;
    private final RevisionScheduleRepository revisionScheduleRepository;
    private final RevisionSessionRepository revisionSessionRepository;
    private final UserPatternStatsRepository patternStatsRepository;
    private final ExplanationRecordingRepository recordingRepository;
    private final QuestionRepository questionRepository;

    // Priority weights
    private static final double LOW_CONFIDENCE_WEIGHT = 0.4;
    private static final double TIME_DECAY_WEIGHT = 0.3;
    private static final double PATTERN_WEAKNESS_WEIGHT = 0.2;

    // Thresholds
    private static final double PRIORITY_THRESHOLD = 0.3;
    private static final int MAX_DAILY_REVISIONS = 5;
    private static final int TIME_DECAY_START_DAYS = 7;

    /**
     * Generate daily revision queue for a user.
     * Prioritizes questions based on:
     * 1. Low confidence score
     * 2. Time since last practice
     * 3. Pattern weakness
     */
    @Transactional
    public List<RevisionSchedule> generateDailyQueue(User user) {
        // Get all completed questions without pending revisions
        List<UserQuestion> completedQuestions = userQuestionRepository
                .findCompletedByUserId(user.getId());

        return completedQuestions.stream()
                .filter(uq -> !revisionScheduleRepository.existsByUserQuestionIdAndCompletedAtIsNull(uq.getId()))
                .map(uq -> calculatePriority(user, uq))
                .filter(candidate -> candidate.priorityScore > PRIORITY_THRESHOLD)
                .sorted(Comparator.comparing(RevisionCandidate::priorityScore).reversed())
                .limit(MAX_DAILY_REVISIONS)
                .map(candidate -> createSchedule(user, candidate))
                .collect(Collectors.toList());
    }

    /**
     * Get pending revisions for a user (already scheduled).
     */
    public List<RevisionSchedule> getPendingRevisions(User user) {
        return revisionScheduleRepository.findPendingByUserId(user.getId());
    }

    /**
     * Get revisions due today.
     */
    public List<RevisionSchedule> getTodayRevisions(User user) {
        return revisionScheduleRepository.findDueByUserId(user.getId(), Instant.now());
    }

    /**
     * Complete a revision session.
     */
    @Transactional
    public RevisionSession completeRevision(
            RevisionSchedule schedule,
            int listenedVersion,
            boolean rerecorded,
            Integer newConfidenceScore) {
        // Mark schedule as completed
        schedule.markCompleted();
        revisionScheduleRepository.save(schedule);

        // Update user question confidence if provided
        if (newConfidenceScore != null) {
            UserQuestion uq = schedule.getUserQuestion();
            uq.setConfidenceScore(newConfidenceScore);
            userQuestionRepository.save(uq);
        }

        // Create session record
        RevisionSession session = RevisionSession.builder()
                .revisionSchedule(schedule)
                .listenedAudioVersion(listenedVersion)
                .rerecorded(rerecorded)
                .newConfidenceScore(newConfidenceScore)
                .build();

        return revisionSessionRepository.save(session);
    }

    /**
     * Schedule a revision for a specific question after completion.
     * Called when user completes a question.
     */
    @Transactional
    public RevisionSchedule scheduleInitialRevision(User user, UserQuestion userQuestion) {
        // Schedule first revision 3 days after completion
        Instant scheduledAt = Instant.now().plus(3, ChronoUnit.DAYS);

        RevisionSchedule.Reason reason = userQuestion.getConfidenceScore() != null
                && userQuestion.getConfidenceScore() <= 2
                        ? RevisionSchedule.Reason.LOW_CONFIDENCE
                        : RevisionSchedule.Reason.TIME_DECAY;

        RevisionSchedule schedule = RevisionSchedule.builder()
                .user(user)
                .userQuestion(userQuestion)
                .pattern(userQuestion.getQuestion().getPattern())
                .scheduledAt(scheduledAt)
                .reason(reason)
                .priorityScore(0.5) // Initial priority
                .build();

        return revisionScheduleRepository.save(schedule);
    }

    private RevisionCandidate calculatePriority(User user, UserQuestion uq) {
        double score = 0.0;
        RevisionSchedule.Reason primaryReason = null;

        // 1. Low confidence factor (0.25 - 1.0)
        if (uq.getConfidenceScore() != null && uq.getConfidenceScore() <= 2) {
            double factor = (5 - uq.getConfidenceScore()) / 4.0;
            score += LOW_CONFIDENCE_WEIGHT * factor;
            primaryReason = RevisionSchedule.Reason.LOW_CONFIDENCE;
        }

        // 2. Time decay factor (0 - 1.0)
        long daysSinceDone = uq.getDoneAt() != null
                ? ChronoUnit.DAYS.between(uq.getDoneAt(), Instant.now())
                : 0;

        if (daysSinceDone > TIME_DECAY_START_DAYS) {
            double factor = Math.min(daysSinceDone / 30.0, 1.0);
            score += TIME_DECAY_WEIGHT * factor;
            if (primaryReason == null)
                primaryReason = RevisionSchedule.Reason.TIME_DECAY;
        }

        // 3. Pattern weakness factor (0 - 0.6)
        Pattern pattern = uq.getQuestion().getPattern();
        long totalForPattern = questionRepository.countByPatternId(pattern.getId());
        var stats = patternStatsRepository.findByUserIdAndPatternId(user.getId(), pattern.getId());

        if (totalForPattern > 0) {
            double completionRate = stats.map(s -> s.getQuestionsCompleted() / (double) totalForPattern)
                    .orElse(0.0);
            if (completionRate < 0.5) {
                score += PATTERN_WEAKNESS_WEIGHT * (1 - completionRate);
                if (primaryReason == null)
                    primaryReason = RevisionSchedule.Reason.PATTERN_WEAKNESS;
            }
        }

        // 4. Recency decay (multiplier for older items)
        double recencyDecay = 1 + (daysSinceDone / 60.0);
        score *= recencyDecay;

        return new RevisionCandidate(
                uq,
                score,
                primaryReason != null ? primaryReason : RevisionSchedule.Reason.TIME_DECAY,
                daysSinceDone);
    }

    private RevisionSchedule createSchedule(User user, RevisionCandidate candidate) {
        RevisionSchedule schedule = RevisionSchedule.builder()
                .user(user)
                .userQuestion(candidate.userQuestion)
                .pattern(candidate.userQuestion.getQuestion().getPattern())
                .scheduledAt(Instant.now())
                .reason(candidate.reason)
                .priorityScore(candidate.priorityScore)
                .build();

        return revisionScheduleRepository.save(schedule);
    }

    private record RevisionCandidate(
            UserQuestion userQuestion,
            double priorityScore,
            RevisionSchedule.Reason reason,
            long daysSinceLastPractice) {
    }
}
