package com.rewind.repository;

import com.rewind.model.RevisionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RevisionSessionRepository extends JpaRepository<RevisionSession, UUID> {
}
