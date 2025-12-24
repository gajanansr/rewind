package com.rewind.repository;

import com.rewind.model.ReadinessEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReadinessEventRepository extends JpaRepository<ReadinessEvent, UUID> {
    List<ReadinessEvent> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<ReadinessEvent> findTop10ByUserIdOrderByCreatedAtDesc(UUID userId);
}
