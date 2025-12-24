package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "readiness_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadinessSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "days_remaining", nullable = false)
    private Integer daysRemaining;

    @Column(name = "calculated_at")
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
