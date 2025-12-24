package com.rewind.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ReadinessDTO {

    @Data
    @Builder
    public static class ReadinessResponse {
        private Integer daysRemaining;
        private Integer targetDays;
        private Integer percentComplete;
        private String trend;
        private ReadinessBreakdown breakdown;
        private List<ReadinessEventInfo> recentEvents;
    }

    @Data
    @Builder
    public static class ReadinessBreakdown {
        private Integer questionsSolved;
        private Integer questionsTotal;
        private Integer easyComplete;
        private Integer mediumComplete;
        private Integer hardComplete;
        private Integer revisionsComplete;
        private List<String> weakPatterns;
    }

    @Data
    @Builder
    public static class ReadinessEventInfo {
        private Integer delta;
        private String reason;
        private Instant createdAt;
    }
}
