package com.rewind.repository;

import com.rewind.model.UserQuestion;
import com.rewind.model.UserQuestion.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserQuestionRepository extends JpaRepository<UserQuestion, UUID> {

    Optional<UserQuestion> findByUserIdAndQuestionId(UUID userId, UUID questionId);

    // Optimized query with JOIN FETCH to eliminate N+1
    @Query("SELECT uq FROM UserQuestion uq " +
            "JOIN FETCH uq.question q " +
            "JOIN FETCH q.pattern " +
            "WHERE uq.user.id = :userId")
    List<UserQuestion> findByUserIdWithQuestionAndPattern(UUID userId);

    // Lightweight query for status map - only returns questionId and status
    @Query("SELECT uq.question.id, uq.status FROM UserQuestion uq WHERE uq.user.id = :userId")
    List<Object[]> findQuestionStatusByUserId(UUID userId);

    // Legacy method (keep for compatibility)
    List<UserQuestion> findByUserId(UUID userId);

    List<UserQuestion> findByUserIdAndStatus(UUID userId, Status status);

    @Query("SELECT uq FROM UserQuestion uq WHERE uq.user.id = :userId AND uq.status = 'DONE'")
    List<UserQuestion> findCompletedByUserId(UUID userId);

    @Query("SELECT COUNT(uq) FROM UserQuestion uq WHERE uq.user.id = :userId AND uq.status = 'DONE'")
    long countCompletedByUserId(UUID userId);

    @Query("SELECT COUNT(uq) FROM UserQuestion uq WHERE uq.user.id = :userId AND uq.status = 'DONE' AND uq.doneAt >= :since")
    long countCompletedSince(UUID userId, Instant since);

    @Query("SELECT COUNT(uq) FROM UserQuestion uq WHERE uq.user.id = :userId AND uq.question.difficulty = :difficulty AND uq.status = 'DONE'")
    long countCompletedByDifficulty(UUID userId, String difficulty);

    @Query("SELECT uq FROM UserQuestion uq WHERE uq.user.id = :userId AND uq.status = 'DONE' AND uq.doneAt >= :since ORDER BY uq.doneAt DESC")
    List<UserQuestion> findCompletedByUserIdSince(UUID userId, Instant since);

    // Optimized findById with Question and Pattern
    @Query("SELECT uq FROM UserQuestion uq " +
            "JOIN FETCH uq.question q " +
            "JOIN FETCH q.pattern " +
            "WHERE uq.id = :id")
    Optional<UserQuestion> findByIdWithQuestionAndPattern(UUID id);

    // Daily activity count for heatmap (last 365 days)
    @Query(value = "SELECT DATE(done_at) as date, COUNT(*) as count " +
            "FROM user_questions " +
            "WHERE user_id = :userId AND status = 'DONE' AND done_at >= :since " +
            "GROUP BY DATE(done_at) " +
            "ORDER BY date", nativeQuery = true)
    List<Object[]> findDailyActivityCounts(UUID userId, Instant since);
}
