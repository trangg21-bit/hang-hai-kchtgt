package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.DryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DryPortRepository extends JpaRepository<DryPort, UUID> {

    Optional<DryPort> findByDryPortCode(String dryPortCode);

    boolean existsByDryPortCode(String dryPortCode);

    @Query("SELECT d FROM DryPort d WHERE d.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId)")
    Page<DryPort> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    @Query("SELECT MAX(d.dryPortCode) FROM DryPort d WHERE d.dryPortCode LIKE 'CC-%'")
    Optional<String> findMaxCode();

    @Query("SELECT d FROM DryPort d WHERE d.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(d.dryPortCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(d.dryPortName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) " +
            "AND (:operationalStatus IS NULL OR d.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus)")
    Page<DryPort> searchDryPorts(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);
}
