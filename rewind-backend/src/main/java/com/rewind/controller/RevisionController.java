package com.rewind.controller;

import com.rewind.dto.RevisionDTO.*;
import com.rewind.model.*;
import com.rewind.repository.ExplanationRecordingRepository;
import com.rewind.service.ReadinessService;
import com.rewind.service.RevisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/revisions")
@RequiredArgsConstructor
public class RevisionController {

    private final RevisionService revisionService;
    private final ReadinessService readinessService;
    private final ExplanationRecordingRepository recordingRepository;

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingRevisions(
            @AuthenticationPrincipal User user) {
        List<RevisionSchedule> pending = revisionService.getPendingRevisions(user);
        List<RevisionScheduleResponse> response = pending.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "revisions", response,
                "totalPending", pending.size()));
    }

    @GetMapping("/today")
    public ResponseEntity<List<RevisionScheduleResponse>> getTodayRevisions(
            @AuthenticationPrincipal User user) {
        List<RevisionSchedule> today = revisionService.getTodayRevisions(user);

        // If no scheduled revisions, generate new ones
        if (today.isEmpty()) {
            today = revisionService.generateDailyQueue(user);
        }

        List<RevisionScheduleResponse> response = today.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{scheduleId}/complete")
    public ResponseEntity<CompleteRevisionResponse> completeRevision(
            @AuthenticationPrincipal User user,
            @PathVariable UUID scheduleId,
            @RequestBody CompleteRevisionRequest request) {
        // Find schedule
        RevisionSchedule schedule = revisionService.getPendingRevisions(user).stream()
                .filter(s -> s.getId().equals(scheduleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Revision not found"));

        // Complete revision
        RevisionSession session = revisionService.completeRevision(
                schedule,
                request.getListenedVersion(),
                request.getRerecorded() != null ? request.getRerecorded() : false,
                request.getNewConfidenceScore());

        // Calculate readiness bonus
        readinessService.calculateRevisionCompletion(user, schedule);

        return ResponseEntity.ok(CompleteRevisionResponse.builder()
                .sessionId(session.getId())
                .success(true)
                .message("Revision completed!")
                .build());
    }

    @PostMapping("/generate")
    public ResponseEntity<List<RevisionScheduleResponse>> generateQueue(
            @AuthenticationPrincipal User user) {
        List<RevisionSchedule> generated = revisionService.generateDailyQueue(user);
        List<RevisionScheduleResponse> response = generated.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    private RevisionScheduleResponse toResponse(RevisionSchedule rs) {
        Question q = rs.getUserQuestion().getQuestion();

        // Get last recording
        var lastRecording = recordingRepository
                .findLatestByUserQuestionId(rs.getUserQuestion().getId())
                .map(r -> RecordingInfo.builder()
                        .version(r.getVersion())
                        .audioUrl(r.getAudioUrl())
                        .recordedAt(r.getRecordedAt())
                        .build())
                .orElse(null);

        // Calculate days since last practice
        Instant lastPractice = rs.getUserQuestion().getDoneAt();
        long daysSince = lastPractice != null
                ? ChronoUnit.DAYS.between(lastPractice, Instant.now())
                : 0;

        return RevisionScheduleResponse.builder()
                .scheduleId(rs.getId())
                .question(QuestionInfo.builder()
                        .id(q.getId())
                        .title(q.getTitle())
                        .difficulty(q.getDifficulty())
                        .pattern(q.getPattern().getName())
                        .build())
                .reason(rs.getReason().name())
                .priorityScore(rs.getPriorityScore())
                .scheduledAt(rs.getScheduledAt())
                .lastRecording(lastRecording)
                .daysSinceLastPractice(daysSince)
                .build();
    }
}
