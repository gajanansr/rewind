package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.*;
import com.rewind.repository.ExplanationRecordingRepository;
import com.rewind.repository.ReadinessEventRepository;
import com.rewind.repository.SolutionRepository;
import com.rewind.repository.UserQuestionRepository;
import com.rewind.repository.UserRepository;
import com.rewind.service.UserQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/user-questions")
@RequiredArgsConstructor
public class UserQuestionController {

        private final UserQuestionService userQuestionService;
        private final UserQuestionRepository userQuestionRepository;
        private final ReadinessEventRepository readinessEventRepository;
        private final UserRepository userRepository;
        private final SolutionRepository solutionRepository;
        private final ExplanationRecordingRepository recordingRepository;

        @GetMapping
        public ResponseEntity<List<UserQuestionResponse>> getMyQuestions(
                        @AuthenticationPrincipal User user) {
                // Use optimized query with JOIN FETCH
                List<UserQuestion> questions = userQuestionRepository.findByUserIdWithQuestionAndPattern(user.getId());
                List<UserQuestionResponse> response = questions.stream()
                                .map(this::toResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(response);
        }

        /**
         * Lightweight endpoint that only returns question IDs with their status.
         * Much faster than loading full question data - ideal for initial page load.
         */
        @GetMapping("/status-map")
        public ResponseEntity<Map<UUID, String>> getStatusMap(
                        @AuthenticationPrincipal User user) {
                List<Object[]> results = userQuestionRepository.findQuestionStatusByUserId(user.getId());

                Map<UUID, String> statusMap = new HashMap<>();
                for (Object[] row : results) {
                        UUID questionId = (UUID) row[0];
                        UserQuestion.Status status = (UserQuestion.Status) row[1];
                        statusMap.put(questionId, status.name());
                }

                return ResponseEntity.ok(statusMap);
        }

        /**
         * Daily activity counts for GitHub-style contribution heatmap.
         * Returns a map of date -> count for the last 365 days.
         */
        @GetMapping("/activity")
        public ResponseEntity<Map<String, Integer>> getDailyActivity(
                        @AuthenticationPrincipal User user) {
                java.time.Instant since = java.time.Instant.now().minus(365, java.time.temporal.ChronoUnit.DAYS);
                List<Object[]> results = userQuestionRepository.findDailyActivityCounts(user.getId(), since);

                Map<String, Integer> activityMap = new java.util.LinkedHashMap<>();
                for (Object[] row : results) {
                        // Handle both java.sql.Date and LocalDate
                        String dateStr;
                        if (row[0] instanceof java.sql.Date) {
                                dateStr = ((java.sql.Date) row[0]).toLocalDate().toString();
                        } else if (row[0] instanceof java.time.LocalDate) {
                                dateStr = row[0].toString();
                        } else {
                                dateStr = row[0].toString();
                        }
                        int count = ((Number) row[1]).intValue();
                        activityMap.put(dateStr, count);
                }

                return ResponseEntity.ok(activityMap);
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

                // Check if user is authenticated
                if (user == null) {
                        return ResponseEntity.status(401).build();
                }

                UserQuestion uq = userQuestionService.getProgress(user, questionId);
                if (uq == null) {
                        // Return empty response instead of 404 for unsolved questions
                        return ResponseEntity.ok(QuestionHistoryResponse.builder()
                                        .userQuestion(null)
                                        .solutions(List.of())
                                        .recordings(List.of())
                                        .build());
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

        @DeleteMapping("/reset")
        @Transactional
        public ResponseEntity<Void> resetProgress(@AuthenticationPrincipal User user) {
                // Delete all user questions
                userQuestionRepository.deleteByUserId(user.getId());

                // Delete all readiness events
                readinessEventRepository.deleteByUserId(user.getId());

                // Reset user stats
                user.setCurrentReadinessDays(user.getInterviewTargetDays());
                userRepository.save(user);

                return ResponseEntity.noContent().build();
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
