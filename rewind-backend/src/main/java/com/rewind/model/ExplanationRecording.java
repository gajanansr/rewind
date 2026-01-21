package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "explanation_recordings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExplanationRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_question_id", nullable = false)
    private UserQuestion userQuestion;

    @Column(name = "audio_url", nullable = false, columnDefinition = "TEXT")
    private String audioUrl;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "recorded_at")
    @Builder.Default
    private Instant recordedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_status")
    @Builder.Default
    private AnalysisStatus analysisStatus = AnalysisStatus.PENDING;

    public enum AnalysisStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}
