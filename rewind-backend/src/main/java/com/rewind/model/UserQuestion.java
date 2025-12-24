package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_questions", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "question_id" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQuestion {

    public enum Status {
        NOT_STARTED, STARTED, DONE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.NOT_STARTED;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "solved_duration_seconds")
    private Integer solvedDurationSeconds;

    @Column(name = "done_at")
    private Instant doneAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    // Lifecycle methods
    public void start() {
        this.status = Status.STARTED;
        this.startedAt = Instant.now();
    }

    public void markDone(Integer confidenceScore) {
        this.status = Status.DONE;
        this.doneAt = Instant.now();
        this.confidenceScore = confidenceScore;
        if (this.startedAt != null) {
            this.solvedDurationSeconds = (int) java.time.Duration.between(startedAt, doneAt).getSeconds();
        }
    }
}
