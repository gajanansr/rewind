package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_pattern_stats", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "pattern_id" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPatternStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pattern_id", nullable = false)
    private Pattern pattern;

    @Column(name = "questions_attempted")
    @Builder.Default
    private Integer questionsAttempted = 0;

    @Column(name = "questions_completed")
    @Builder.Default
    private Integer questionsCompleted = 0;

    @Column(name = "avg_confidence")
    @Builder.Default
    private Double avgConfidence = 0.0;

    @Column(name = "last_practiced_at")
    private Instant lastPracticedAt;

    // Helper methods
    public void incrementAttempted() {
        this.questionsAttempted++;
    }

    public void incrementCompleted(Integer confidenceScore) {
        this.questionsCompleted++;
        this.lastPracticedAt = Instant.now();
        // Recalculate average confidence
        if (confidenceScore != null) {
            this.avgConfidence = ((this.avgConfidence * (questionsCompleted - 1)) + confidenceScore)
                    / questionsCompleted;
        }
    }
}
