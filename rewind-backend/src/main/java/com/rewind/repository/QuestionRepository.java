package com.rewind.repository;

import com.rewind.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findAllByOrderByOrderIndexAsc();

    List<Question> findByDifficultyOrderByOrderIndexAsc(String difficulty);

    @Query("SELECT q FROM Question q WHERE q.pattern.id = :patternId ORDER BY q.orderIndex")
    List<Question> findByPatternIdOrderByOrderIndexAsc(UUID patternId);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.pattern.id = :patternId")
    long countByPatternId(UUID patternId);
}
