package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.*;
import com.rewind.service.UserQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recordings")
@RequiredArgsConstructor
public class RecordingController {

    private final UserQuestionService userQuestionService;

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
        // For now, returning the expected structure
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
}
