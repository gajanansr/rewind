package com.rewind.repository;

import com.rewind.model.ExplanationRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExplanationRecordingRepository extends JpaRepository<ExplanationRecording, UUID> {

    List<ExplanationRecording> findByUserQuestionIdOrderByVersionDesc(UUID userQuestionId);

    @Query("SELECT er FROM ExplanationRecording er WHERE er.userQuestion.id = :userQuestionId ORDER BY er.version DESC LIMIT 1")
    Optional<ExplanationRecording> findLatestByUserQuestionId(UUID userQuestionId);

    @Query("SELECT COALESCE(MAX(er.version), 0) FROM ExplanationRecording er WHERE er.userQuestion.id = :userQuestionId")
    int findMaxVersionByUserQuestionId(UUID userQuestionId);
}
