package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.PlanningFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanningFileRepository extends JpaRepository<PlanningFile, UUID> {
}
