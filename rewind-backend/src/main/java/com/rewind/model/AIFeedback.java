package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIFeedback {

    public enum FeedbackType {
        HINT, COMMUNICATION_TIP, REFLECTION_QUESTION
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_question_id", nullable = false)
    private UserQuestion userQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recording_id")
    private ExplanationRecording recording;

    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_type", nullable = false, length = 30)
    private FeedbackType feedbackType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
