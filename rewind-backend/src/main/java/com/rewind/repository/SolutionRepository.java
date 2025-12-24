package com.rewind.repository;

import com.rewind.model.Solution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolutionRepository extends JpaRepository<Solution, UUID> {

    List<Solution> findByUserQuestionIdOrderByCreatedAtDesc(UUID userQuestionId);

    @Query("SELECT s FROM Solution s WHERE s.userQuestion.id = :userQuestionId ORDER BY s.createdAt DESC LIMIT 1")
    Optional<Solution> findLatestByUserQuestionId(UUID userQuestionId);
}
