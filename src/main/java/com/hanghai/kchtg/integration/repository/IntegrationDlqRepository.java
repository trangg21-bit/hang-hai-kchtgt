package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.IntegrationDlq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IntegrationDlqRepository extends JpaRepository<IntegrationDlq, UUID> {
    List<IntegrationDlq> findBySyncJobId(UUID syncJobId);
    List<IntegrationDlq> findByResolved(Boolean resolved);
}
