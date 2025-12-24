package com.rewind.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private UUID id; // Linked to Supabase auth.users

    @Column(length = 100)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(name = "interview_target_days")
    @Builder.Default
    private Integer interviewTargetDays = 90;

    @Column(name = "current_readiness_days")
    @Builder.Default
    private Integer currentReadinessDays = 90;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
