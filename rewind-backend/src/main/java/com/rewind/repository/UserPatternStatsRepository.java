package com.rewind.repository;

import com.rewind.model.UserPatternStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPatternStatsRepository extends JpaRepository<UserPatternStats, UUID> {

    List<UserPatternStats> findByUserId(UUID userId);

    Optional<UserPatternStats> findByUserIdAndPatternId(UUID userId, UUID patternId);
}
