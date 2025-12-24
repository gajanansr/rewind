package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 10)
    private String difficulty;

    @Column(name = "leetcode_url", nullable = false, columnDefinition = "TEXT")
    private String leetcodeUrl;

    @Column(name = "time_minutes", nullable = false)
    private Integer timeMinutes;

    @Column(name = "order_index", nullable = false, unique = true)
    private Integer orderIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pattern_id", nullable = false)
    private Pattern pattern;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
