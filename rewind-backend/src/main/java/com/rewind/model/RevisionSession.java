package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revision_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevisionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revision_schedule_id", nullable = false)
    private RevisionSchedule revisionSchedule;

    @Column(name = "listened_audio_version", nullable = false)
    private Integer listenedAudioVersion;

    @Column(name = "rerecorded")
    @Builder.Default
    private Boolean rerecorded = false;

    @Column(name = "new_confidence_score")
    private Integer newConfidenceScore;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
