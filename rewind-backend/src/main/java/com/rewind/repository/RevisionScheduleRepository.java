package com.rewind.repository;

import com.rewind.model.RevisionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevisionScheduleRepository extends JpaRepository<RevisionSchedule, UUID> {

    @Query("SELECT rs FROM RevisionSchedule rs WHERE rs.user.id = :userId AND rs.completedAt IS NULL ORDER BY rs.priorityScore DESC")
    List<RevisionSchedule> findPendingByUserId(UUID userId);

    @Query("SELECT rs FROM RevisionSchedule rs WHERE rs.user.id = :userId AND rs.completedAt IS NULL AND rs.scheduledAt <= :now ORDER BY rs.priorityScore DESC")
    List<RevisionSchedule> findDueByUserId(UUID userId, Instant now);

    boolean existsByUserQuestionIdAndCompletedAtIsNull(UUID userQuestionId);

    Optional<RevisionSchedule> findFirstByUserQuestionIdAndCompletedAtIsNull(UUID userQuestionId);

    @Query("SELECT COUNT(rs) FROM RevisionSchedule rs WHERE rs.user.id = :userId AND rs.completedAt IS NOT NULL")
    long countCompletedByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM RevisionSchedule rs WHERE rs.user.id = :userId")
    void deleteByUserId(UUID userId);

    @Query("SELECT rs.id FROM RevisionSchedule rs WHERE rs.user.id = :userId")
    List<UUID> findIdsByUserId(UUID userId);
}
