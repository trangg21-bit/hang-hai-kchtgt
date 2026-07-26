package com.hanghai.kchtg.document.repository;

import java.util.UUID;
import com.hanghai.kchtg.document.entity.ProcessingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProcessingProgressRepository extends JpaRepository<ProcessingProgress, UUID> {

    /** Find all progress records for a specific incident */
    List<ProcessingProgress> findByIncidentId(java.util.UUID incidentId);
}
