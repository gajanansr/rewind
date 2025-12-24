package com.rewind.repository;

import com.rewind.model.AIFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIFeedbackRepository extends JpaRepository<AIFeedback, UUID> {
    List<AIFeedback> findByUserQuestionIdOrderByCreatedAtDesc(UUID userQuestionId);
}
