package com.rewind.repository;

import com.rewind.model.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    // Optimized queries with JOIN FETCH to eliminate N+1 problem
    @Query("SELECT q FROM Question q JOIN FETCH q.pattern ORDER BY q.orderIndex")
    List<Question> findAllWithPatternOrderByOrderIndex();

    @Query("SELECT q FROM Question q JOIN FETCH q.pattern WHERE q.difficulty = :difficulty ORDER BY q.orderIndex")
    List<Question> findByDifficultyWithPatternOrderByOrderIndex(String difficulty);

    @Query("SELECT q FROM Question q JOIN FETCH q.pattern WHERE q.pattern.id = :patternId ORDER BY q.orderIndex")
    List<Question> findByPatternIdWithPatternOrderByOrderIndex(UUID patternId);

    @Query("SELECT q FROM Question q JOIN FETCH q.pattern WHERE q.pattern.id = :patternId AND q.difficulty = :difficulty ORDER BY q.orderIndex")
    List<Question> findByPatternIdAndDifficultyWithPatternOrderByOrderIndex(UUID patternId, String difficulty);

    // Paginated versions for lazy loading
    @Query("SELECT q FROM Question q JOIN FETCH q.pattern ORDER BY q.orderIndex")
    Page<Question> findAllWithPatternPaginated(Pageable pageable);

    @Query("SELECT q FROM Question q JOIN FETCH q.pattern WHERE q.difficulty = :difficulty ORDER BY q.orderIndex")
    Page<Question> findByDifficultyWithPatternPaginated(String difficulty, Pageable pageable);

    @Query("SELECT q FROM Question q JOIN FETCH q.pattern WHERE q.pattern.id = :patternId ORDER BY q.orderIndex")
    Page<Question> findByPatternIdWithPatternPaginated(UUID patternId, Pageable pageable);

    // Legacy methods (keep for compatibility)
    List<Question> findAllByOrderByOrderIndexAsc();

    List<Question> findByDifficultyOrderByOrderIndexAsc(String difficulty);

    @Query("SELECT q FROM Question q WHERE q.pattern.id = :patternId ORDER BY q.orderIndex")
    List<Question> findByPatternIdOrderByOrderIndexAsc(UUID patternId);

    @Query("SELECT q FROM Question q WHERE q.pattern.id = :patternId AND q.difficulty = :difficulty ORDER BY q.orderIndex")
    List<Question> findByPatternIdAndDifficultyOrderByOrderIndexAsc(UUID patternId, String difficulty);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.pattern.id = :patternId")
    long countByPatternId(UUID patternId);

    // Optimized findById with Pattern
    @Query("SELECT q FROM Question q JOIN FETCH q.pattern WHERE q.id = :id")
    Optional<Question> findByIdWithPattern(UUID id);
}
