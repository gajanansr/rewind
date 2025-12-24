package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revision_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevisionSchedule {

    public enum Reason {
        LOW_CONFIDENCE, TIME_DECAY, PATTERN_WEAKNESS, MANUAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_question_id", nullable = false)
    private UserQuestion userQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pattern_id", nullable = false)
    private Pattern pattern;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Reason reason;

    @Column(name = "priority_score")
    @Builder.Default
    private Double priorityScore = 0.0;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isPending() {
        return completedAt == null;
    }

    public void markCompleted() {
        this.completedAt = Instant.now();
    }
}
