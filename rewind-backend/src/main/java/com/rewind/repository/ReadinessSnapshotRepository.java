package com.rewind.repository;

import com.rewind.model.ReadinessSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReadinessSnapshotRepository extends JpaRepository<ReadinessSnapshot, UUID> {
    List<ReadinessSnapshot> findByUserIdOrderByCalculatedAtDesc(UUID userId);
}
