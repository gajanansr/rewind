package com.rewind.controller;

import com.rewind.dto.ReadinessDTO.*;
import com.rewind.model.User;
import com.rewind.model.UserPatternStats;
import com.rewind.repository.ReadinessEventRepository;
import com.rewind.repository.UserPatternStatsRepository;
import com.rewind.service.ReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/readiness")
@RequiredArgsConstructor
public class ReadinessController {

        private final ReadinessService readinessService;
        private final ReadinessEventRepository eventRepository;
        private final UserPatternStatsRepository patternStatsRepository;

        @GetMapping
        public ResponseEntity<ReadinessResponse> getReadiness(
                        @AuthenticationPrincipal User user) {
                var breakdown = readinessService.getBreakdown(user);

                // Get recent events
                var recentEvents = eventRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId())
                                .stream()
                                .map(e -> ReadinessEventInfo.builder()
                                                .delta(e.getChangeDeltaDays())
                                                .reason(e.getReason())
                                                .createdAt(e.getCreatedAt())
                                                .build())
                                .collect(Collectors.toList());

                // Find weak patterns with improved logic
                // Score = (1 - completion_rate) * 0.4 + (3 - avg_confidence)/3 * 0.4 +
                // days_since_practice/30 * 0.2
                var allStats = patternStatsRepository.findByUserId(user.getId());
                List<String> weakPatterns = allStats.stream()
                                .filter(s -> s.getQuestionsAttempted() > 0) // Only include attempted patterns
                                .sorted((a, b) -> {
                                        double scoreA = calculateWeaknessScore(a);
                                        double scoreB = calculateWeaknessScore(b);
                                        return Double.compare(scoreB, scoreA); // Higher score = weaker
                                })
                                .filter(s -> {
                                        // Only consider weak if:
                                        // - Low confidence (< 3.5/5)
                                        // - OR low completion rate (< 50%)
                                        // - OR not practiced recently (> 14 days)
                                        return s.getAvgConfidence() < 3.5
                                                        || (s.getQuestionsCompleted() < s.getQuestionsAttempted() * 0.5)
                                                        || (s.getLastPracticedAt() != null &&
                                                                        ChronoUnit.DAYS.between(s.getLastPracticedAt(),
                                                                                        Instant.now()) > 14);
                                })
                                .map(s -> s.getPattern().getName())
                                .limit(5)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(ReadinessResponse.builder()
                                .daysRemaining(breakdown.getDaysRemaining())
                                .targetDays(breakdown.getTargetDays())
                                .percentComplete(breakdown.getPercentComplete())
                                .trend(breakdown.getTrend())
                                .breakdown(ReadinessBreakdown.builder()
                                                .questionsSolved(breakdown.getQuestionsSolved())
                                                .questionsTotal(breakdown.getQuestionsTotal())
                                                .easyComplete(breakdown.getEasyComplete())
                                                .mediumComplete(breakdown.getMediumComplete())
                                                .hardComplete(breakdown.getHardComplete())
                                                .revisionsComplete(breakdown.getRevisionsComplete())
                                                .weakPatterns(weakPatterns)
                                                .build())
                                .recentEvents(recentEvents)
                                .build());
        }

        /**
         * Calculate a weakness score for a pattern.
         * Higher score = weaker pattern.
         * Formula: (1 - completion_rate) * 0.4 + (5 - avgConfidence)/5 * 0.4 +
         * daysSincePractice/30 * 0.2
         */
        private double calculateWeaknessScore(UserPatternStats stats) {
                // Completion rate (0 = none completed, 1 = all completed)
                double completionRate = stats.getQuestionsAttempted() > 0
                                ? (double) stats.getQuestionsCompleted() / stats.getQuestionsAttempted()
                                : 0;

                // Confidence factor (0 = high confidence, 1 = low confidence)
                double confidenceFactor = (5.0 - stats.getAvgConfidence()) / 5.0;

                // Recency factor (0 = practiced today, 1 = not practiced in 30+ days)
                double recencyFactor = 0;
                if (stats.getLastPracticedAt() != null) {
                        long daysSince = ChronoUnit.DAYS.between(stats.getLastPracticedAt(), Instant.now());
                        recencyFactor = Math.min(1.0, daysSince / 30.0);
                } else {
                        recencyFactor = 1.0; // Never practiced = maximum recency penalty
                }

                // Weighted score
                return (1 - completionRate) * 0.4 + confidenceFactor * 0.4 + recencyFactor * 0.2;
        }
}
