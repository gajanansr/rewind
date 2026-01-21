package com.rewind.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public class RevisionDTO {

    @Data
    @Builder
    public static class RevisionScheduleResponse {
        private UUID scheduleId;
        private QuestionInfo question;
        private String reason;
        private Double priorityScore;
        private Instant scheduledAt;
        private RecordingInfo lastRecording;
        private Long daysSinceLastPractice;
    }

    @Data
    @Builder
    public static class QuestionInfo {
        private UUID id;
        private String title;
        private String difficulty;
        private String pattern;
        private String leetcodeUrl;
    }

    @Data
    @Builder
    public static class RecordingInfo {
        private UUID id;
        private Integer version;
        private String audioUrl;
        private Instant recordedAt;
    }

    @Data
    public static class CompleteRevisionRequest {
        private Integer listenedVersion;
        private Boolean rerecorded;
        private Integer newConfidenceScore;
    }

    @Data
    @Builder
    public static class CompleteRevisionResponse {
        private UUID sessionId;
        private boolean success;
        private String message;
    }
}
