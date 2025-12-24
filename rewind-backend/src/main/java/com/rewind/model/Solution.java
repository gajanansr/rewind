package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "solutions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Solution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_question_id", nullable = false)
    private UserQuestion userQuestion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(name = "leetcode_submission_link", columnDefinition = "TEXT")
    private String leetcodeSubmissionLink;

    @Column(name = "is_optimal")
    private Boolean isOptimal;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
