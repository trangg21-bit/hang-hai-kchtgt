package com.hanghai.kchtg.businessintegration.repository;

import com.hanghai.kchtg.businessintegration.entity.BusinessDataIntegrationRecord;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BusinessDataIntegrationRecordRepository extends JpaRepository<BusinessDataIntegrationRecord, String> {
    List<BusinessDataIntegrationRecord> findByIntegrationType(IntegrationType integrationType);
    List<BusinessDataIntegrationRecord> findByStatus(IntegrationStatus status);
    List<BusinessDataIntegrationRecord> findByIntegrationTypeAndStatus(IntegrationType integrationType, IntegrationStatus status);
    List<BusinessDataIntegrationRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<BusinessDataIntegrationRecord> findBySourceSystem(String sourceSystem);
    long countByIntegrationType(IntegrationType integrationType);
    long countByStatus(IntegrationStatus status);

    @Query("SELECT s FROM BusinessDataIntegrationRecord s WHERE s.integrationType = :type AND s.status = :status ORDER BY s.createdAt DESC")
    List<BusinessDataIntegrationRecord> findByTypeAndStatusOrdered(@Param("type") IntegrationType type, @Param("status") IntegrationStatus status);

    @Query("SELECT s FROM BusinessDataIntegrationRecord s WHERE s.integrationDate BETWEEN :start AND :end")
    List<BusinessDataIntegrationRecord> findByIntegrationDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
