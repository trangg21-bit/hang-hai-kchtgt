package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.IntegrationSyncJob;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface IntegrationSyncJobRepository extends JpaRepository<IntegrationSyncJob, UUID> {
    List<IntegrationSyncJob> findByStatus(IntegrationSyncJob.SyncStatus status);
}