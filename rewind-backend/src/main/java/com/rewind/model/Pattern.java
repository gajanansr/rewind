package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patterns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pattern {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(name = "importance_weight")
    @Builder.Default
    private Integer importanceWeight = 1;

    @Column(name = "short_mental_model", columnDefinition = "TEXT")
    private String shortMentalModel;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
