package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.IntegrationDlq;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface IntegrationDlqRepository extends JpaRepository<IntegrationDlq, UUID> {
    List<IntegrationDlq> findBySyncJobId(UUID syncJobId);
    List<IntegrationDlq> findByResolved(Boolean resolved);
}