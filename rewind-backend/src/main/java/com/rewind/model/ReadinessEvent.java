package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "readiness_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadinessEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "change_delta_days", nullable = false)
    private Integer changeDeltaDays;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_question_id")
    private Question relatedQuestion;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
