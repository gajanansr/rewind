package com.rewind.controller;

import com.rewind.model.User;
import com.rewind.service.AnalyticsService;
import com.rewind.service.AnalyticsService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get daily progress for the last N days (default 30).
     * Returns count of questions solved per day.
     */
    @GetMapping("/weekly-progress")
    public ResponseEntity<List<DailyProgress>> getWeeklyProgress(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "30") int days) {

        return ResponseEntity.ok(analyticsService.getWeeklyProgress(user, days));
    }

    /**
     * Get completion progress by pattern.
     * Shows weak patterns that need more practice.
     */
    @GetMapping("/pattern-progress")
    public ResponseEntity<List<PatternProgress>> getPatternProgress(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(analyticsService.getPatternProgress(user));
    }

    /**
     * Get streak data - current streak, longest streak, total completed.
     */
    @GetMapping("/streak")
    public ResponseEntity<StreakData> getStreakData(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(analyticsService.getStreakData(user));
    }

    /**
     * Get all analytics data combined (for dashboard).
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(Map.of(
                "weeklyProgress", analyticsService.getWeeklyProgress(user, 7),
                "patternProgress", analyticsService.getPatternProgress(user),
                "streak", analyticsService.getStreakData(user)));
    }
}
