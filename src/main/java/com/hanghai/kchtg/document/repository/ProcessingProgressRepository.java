package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.ProcessingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcessingProgressRepository extends JpaRepository<ProcessingProgress, UUID> {

    /** Find all progress records for a specific incident */
    List<ProcessingProgress> findByIncidentId(java.util.UUID incidentId);
}
