package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.SeverityLevel;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    /** Find by processing status */
    List<Incident> findByProcessingStatus(ProcessingStatus processingStatus);

    /** Find by severity level */
    List<Incident> findBySeverityLevel(SeverityLevel severityLevel);

    /** Search by location (partial match) */
    Page<Incident> findByLocationContainingIgnoreCase(String location, Pageable pageable);

    /** Search by description (partial match) */
    Page<Incident> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);
}
