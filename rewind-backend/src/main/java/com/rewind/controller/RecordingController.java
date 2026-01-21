package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.*;
import com.rewind.repository.ExplanationRecordingRepository;
import com.rewind.repository.SolutionRepository;
import com.rewind.service.GeminiService;
import com.rewind.service.TranscriptService;
import com.rewind.service.UserQuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/recordings")
@RequiredArgsConstructor
@Slf4j
public class RecordingController {

        private final UserQuestionService userQuestionService;
        private final GeminiService geminiService;
        private final TranscriptService transcriptService;
        private final SolutionRepository solutionRepository;
        private final ExplanationRecordingRepository recordingRepository;

        @Value("${supabase.url}")
        private String supabaseUrl;

        @PostMapping("/upload-url")
        public ResponseEntity<UploadUrlResponse> getUploadUrl(
                        @AuthenticationPrincipal User user,
                        @RequestBody UploadUrlRequest request) {
                // Generate storage path
                String audioPath = String.format(
                                "recordings/%s/%s/v%d.webm",
                                user.getId(),
                                request.getUserQuestionId(),
                                System.currentTimeMillis());

                // In production, this would call Supabase Storage API to get a signed upload
                // URL
                String uploadUrl = supabaseUrl + "/storage/v1/object/audio/" + audioPath;

                return ResponseEntity.ok(UploadUrlResponse.builder()
                                .uploadUrl(uploadUrl)
                                .audioPath(audioPath)
                                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                                .build());
        }

        @PostMapping
        public ResponseEntity<Map<String, Object>> saveRecording(
                        @AuthenticationPrincipal User user,
                        @RequestBody SaveRecordingRequest request) {
                ExplanationRecording recording = userQuestionService.saveRecording(
                                user,
                                request.getUserQuestionId(),
                                request.getAudioUrl(),
                                request.getDurationSeconds(),
                                request.getConfidenceScore());

                return ResponseEntity.status(201).body(Map.of(
                                "recordingId", recording.getId(),
                                "version", recording.getVersion(),
                                "status", "SAVED",
                                "message", "Recording saved. Question marked as DONE."));
        }

        /**
         * Analyze a recording and generate AI feedback.
         */
        @PostMapping("/{recordingId}/analyze")
        @Transactional
        public ResponseEntity<Void> analyzeRecording(
                        @AuthenticationPrincipal User user,
                        @PathVariable UUID recordingId) {

                var recording = recordingRepository.findById(recordingId)
                                .orElseThrow(() -> new RuntimeException("Recording not found"));

                // Basic security check
                if (!recording.getUserQuestion().getUser().getId().equals(user.getId())) {
                        return ResponseEntity.status(403).build();
                }

                // Trigger async analysis
                geminiService.processRecording(recordingId);

                return ResponseEntity.accepted().build();
        }

        /**
         * Get existing AI feedback for a recording.
         */
        @GetMapping("/{recordingId}/feedback")
        @Transactional(readOnly = true)
        public ResponseEntity<Map<String, Object>> getFeedback(
                        @AuthenticationPrincipal User user,
                        @PathVariable UUID recordingId) {

                var recording = recordingRepository.findById(recordingId)
                                .orElseThrow(() -> new RuntimeException("Recording not found"));

                // Basic security check
                if (!recording.getUserQuestion().getUser().getId().equals(user.getId())) {
                        return ResponseEntity.status(403).build();
                }

                // Get feedback specific to this recording (or empty for legacy recordings)
                List<AIFeedback> feedbackList = geminiService.getFeedbackByRecording(recordingId);

                return ResponseEntity.ok(Map.of(
                                "analysisStatus",
                                recording.getAnalysisStatus() != null ? recording.getAnalysisStatus().name()
                                                : "COMPLETED",
                                "feedback", feedbackList.stream()
                                                .map(f -> Map.<String, Object>of(
                                                                "id", f.getId(),
                                                                "type", f.getFeedbackType().name(),
                                                                "message", f.getMessage(),
                                                                "createdAt", f.getCreatedAt()))
                                                .collect(Collectors.toList())));
        }
}
