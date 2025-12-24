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
}
