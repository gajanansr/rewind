package com.rewind.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public class QuestionDTO {

    @Data
    @Builder
    public static class QuestionResponse {
        private UUID id;
        private String title;
        private String difficulty;
        private String leetcodeUrl;
        private Integer timeMinutes;
        private Integer orderIndex;
        private PatternInfo pattern;
    }

    @Data
    @Builder
    public static class PatternInfo {
        private UUID id;
        private String name;
        private String category;
        private String shortMentalModel;
    }

    @Data
    @Builder
    public static class UserQuestionResponse {
        private UUID id;
        private UUID questionId;
        private String status;
        private Integer confidenceScore;
        private Instant startedAt;
        private Integer solvedDurationSeconds;
        private Instant doneAt;
        private QuestionResponse question;
    }

    @Data
    public static class StartQuestionRequest {
        private UUID questionId;
    }

    @Data
    public static class SubmitSolutionRequest {
        private UUID userQuestionId;
        private String code;
        private String language;
        private String leetcodeSubmissionLink;
    }

    @Data
    @Builder
    public static class SolutionResponse {
        private UUID id;
        private String code;
        private String language;
        private String leetcodeSubmissionLink;
        private Boolean isOptimal;
        private Instant createdAt;
    }

    @Data
    public static class SaveRecordingRequest {
        private UUID userQuestionId;
        private String audioUrl;
        private Integer durationSeconds;
        private Integer confidenceScore;
    }

    @Data
    @Builder
    public static class RecordingResponse {
        private UUID id;
        private String audioUrl;
        private String transcript;
        private Integer durationSeconds;
        private Integer version;
        private Instant recordedAt;
    }

    @Data
    public static class UploadUrlRequest {
        private UUID userQuestionId;
        private String contentType;
        private Integer durationSeconds;
    }

    @Data
    @Builder
    public static class UploadUrlResponse {
        private String uploadUrl;
        private String audioPath;
        private Instant expiresAt;
    }
}
