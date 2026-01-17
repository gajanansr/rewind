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
        public ResponseEntity<Map<String, Object>> analyzeRecording(
                        @AuthenticationPrincipal User user,
                        @PathVariable UUID recordingId) {

                var recording = recordingRepository.findById(recordingId)
                                .orElseThrow(() -> new RuntimeException("Recording not found"));

                UserQuestion userQuestion = recording.getUserQuestion();

                // Get the latest solution code if available
                var latestSolution = solutionRepository.findLatestByUserQuestionId(userQuestion.getId());
                String code = latestSolution.map(Solution::getCode).orElse("");
                String language = latestSolution.map(Solution::getLanguage).orElse("python");

                // Generate AI feedback for solution
                List<AIFeedback> feedbackList = geminiService.analyzeSolution(userQuestion, code, language);

                // Transcribe audio if not already transcribed
                if ((recording.getTranscript() == null || recording.getTranscript().isEmpty())
                                && recording.getAudioUrl() != null && !recording.getAudioUrl().isEmpty()) {
                        transcriptService.transcribeRecording(recordingId);
                        // Reload recording to get the transcript
                        recording = recordingRepository.findById(recordingId).orElse(recording);
                }

                // If we have a transcript, also analyze communication
                String transcript = recording.getTranscript();
                log.info("Transcript for recording {}: length={}", recordingId,
                                transcript != null ? transcript.length() : 0);

                if (transcript != null && transcript.length() > 20) { // Only analyze if meaningful transcript
                        log.info("Analyzing transcript: {}",
                                        transcript.substring(0, Math.min(100, transcript.length())));
                        AIFeedback commTip = geminiService.analyzeTranscript(userQuestion, transcript);
                        if (commTip != null) {
                                feedbackList.add(commTip);
                        }
                } else {
                        log.info("Skipping communication analysis - transcript too short or missing");
                }

                return ResponseEntity.ok(Map.of(
                                "recordingId", recordingId,
                                "feedback", feedbackList.stream()
                                                .map(f -> Map.of(
                                                                "type", f.getFeedbackType().name(),
                                                                "message", f.getMessage()))
                                                .collect(Collectors.toList()),
                                "status", "ANALYZED"));
        }

        /**
         * Get existing AI feedback for a recording.
         */
        @GetMapping("/{recordingId}/feedback")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, Object>>> getFeedback(
                        @AuthenticationPrincipal User user,
                        @PathVariable UUID recordingId) {

                var recording = recordingRepository.findById(recordingId)
                                .orElseThrow(() -> new RuntimeException("Recording not found"));

                List<AIFeedback> feedbackList = geminiService.getFeedback(recording.getUserQuestion());

                return ResponseEntity.ok(feedbackList.stream()
                                .map(f -> Map.<String, Object>of(
                                                "id", f.getId(),
                                                "type", f.getFeedbackType().name(),
                                                "message", f.getMessage(),
                                                "createdAt", f.getCreatedAt()))
                                .collect(Collectors.toList()));
        }
}
