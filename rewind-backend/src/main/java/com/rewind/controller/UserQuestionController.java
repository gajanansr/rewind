package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.*;
import com.rewind.repository.*;
import com.rewind.service.UserQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/user-questions")
@RequiredArgsConstructor
public class UserQuestionController {

    private final UserQuestionService userQuestionService;
    private final UserQuestionRepository userQuestionRepository;
    private final SolutionRepository solutionRepository;
    private final ExplanationRecordingRepository recordingRepository;

    @GetMapping
    public ResponseEntity<List<UserQuestionResponse>> getMyQuestions(
            @AuthenticationPrincipal User user) {
        List<UserQuestion> questions = userQuestionRepository.findByUserId(user.getId());
        List<UserQuestionResponse> response = questions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{questionId}/start")
    public ResponseEntity<UserQuestionResponse> startQuestion(
            @AuthenticationPrincipal User user,
            @PathVariable UUID questionId) {
        UserQuestion uq = userQuestionService.startQuestion(user, questionId);
        return ResponseEntity.ok(toResponse(uq));
    }

    @GetMapping("/{questionId}/history")
    public ResponseEntity<QuestionHistoryResponse> getQuestionHistory(
            @AuthenticationPrincipal User user,
            @PathVariable UUID questionId) {
        UserQuestion uq = userQuestionService.getProgress(user, questionId);
        if (uq == null) {
            return ResponseEntity.notFound().build();
        }

        List<SolutionResponse> solutions = solutionRepository
                .findByUserQuestionIdOrderByCreatedAtDesc(uq.getId())
                .stream()
                .map(this::toSolutionResponse)
                .collect(Collectors.toList());

        List<RecordingResponse> recordings = recordingRepository
                .findByUserQuestionIdOrderByVersionDesc(uq.getId())
                .stream()
                .map(this::toRecordingResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(QuestionHistoryResponse.builder()
                .userQuestion(toResponse(uq))
                .solutions(solutions)
                .recordings(recordings)
                .build());
    }

    private UserQuestionResponse toResponse(UserQuestion uq) {
        Question q = uq.getQuestion();
        return UserQuestionResponse.builder()
                .id(uq.getId())
                .questionId(q.getId())
                .status(uq.getStatus().name())
                .confidenceScore(uq.getConfidenceScore())
                .startedAt(uq.getStartedAt())
                .solvedDurationSeconds(uq.getSolvedDurationSeconds())
                .doneAt(uq.getDoneAt())
                .question(QuestionResponse.builder()
                        .id(q.getId())
                        .title(q.getTitle())
                        .difficulty(q.getDifficulty())
                        .leetcodeUrl(q.getLeetcodeUrl())
                        .timeMinutes(q.getTimeMinutes())
                        .orderIndex(q.getOrderIndex())
                        .pattern(PatternInfo.builder()
                                .id(q.getPattern().getId())
                                .name(q.getPattern().getName())
                                .build())
                        .build())
                .build();
    }

    private SolutionResponse toSolutionResponse(Solution s) {
        return SolutionResponse.builder()
                .id(s.getId())
                .code(s.getCode())
                .language(s.getLanguage())
                .leetcodeSubmissionLink(s.getLeetcodeSubmissionLink())
                .isOptimal(s.getIsOptimal())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private RecordingResponse toRecordingResponse(ExplanationRecording r) {
        return RecordingResponse.builder()
                .id(r.getId())
                .audioUrl(r.getAudioUrl())
                .transcript(r.getTranscript())
                .durationSeconds(r.getDurationSeconds())
                .version(r.getVersion())
                .recordedAt(r.getRecordedAt())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class QuestionHistoryResponse {
        private UserQuestionResponse userQuestion;
        private List<SolutionResponse> solutions;
        private List<RecordingResponse> recordings;
    }
}
