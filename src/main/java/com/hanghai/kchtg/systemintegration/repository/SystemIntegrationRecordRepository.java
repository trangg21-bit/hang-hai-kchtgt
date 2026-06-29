package com.hanghai.kchtg.systemintegration.repository;

import com.hanghai.kchtg.systemintegration.entity.SystemIntegrationRecord;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemIntegrationRecordRepository extends JpaRepository<SystemIntegrationRecord, String> {
    List<SystemIntegrationRecord> findByIntegrationType(IntegrationType integrationType);
    List<SystemIntegrationRecord> findByStatus(IntegrationStatus status);
    List<SystemIntegrationRecord> findByIntegrationTypeAndStatus(IntegrationType integrationType, IntegrationStatus status);
    List<SystemIntegrationRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<SystemIntegrationRecord> findBySourceSystem(String sourceSystem);
    long countByIntegrationType(IntegrationType integrationType);
    long countByStatus(IntegrationStatus status);

    @Query("SELECT s FROM SystemIntegrationRecord s WHERE s.integrationType = :type AND s.status = :status ORDER BY s.createdAt DESC")
    List<SystemIntegrationRecord> findByTypeAndStatusOrdered(@Param("type") IntegrationType type, @Param("status") IntegrationStatus status);

    @Query("SELECT s FROM SystemIntegrationRecord s WHERE s.integrationDate BETWEEN :start AND :end")
    List<SystemIntegrationRecord> findByIntegrationDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
