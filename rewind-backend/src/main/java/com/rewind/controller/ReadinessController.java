package com.rewind.controller;

import com.rewind.dto.ReadinessDTO.*;
import com.rewind.model.User;
import com.rewind.repository.ReadinessEventRepository;
import com.rewind.repository.UserPatternStatsRepository;
import com.rewind.service.ReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

        // Find weak patterns
        var allStats = patternStatsRepository.findByUserId(user.getId());
        List<String> weakPatterns = allStats.stream()
                .filter(s -> s.getAvgConfidence() < 3.0 || s.getQuestionsCompleted() < 2)
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
}
