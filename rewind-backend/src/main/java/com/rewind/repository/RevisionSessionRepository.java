package com.rewind.repository;

import com.rewind.model.RevisionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RevisionSessionRepository extends JpaRepository<RevisionSession, UUID> {

    @Modifying
    @Query("DELETE FROM RevisionSession rs WHERE rs.revisionSchedule.id IN :scheduleIds")
    void deleteByRevisionScheduleIdIn(List<UUID> scheduleIds);
}
