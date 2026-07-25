package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.Port;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Port entity.
 * Supports org-unit filtering and code uniqueness checks.
 */
@Repository
public interface PortRepository extends JpaRepository<Port, UUID> {

    Optional<Port> findByPortCode(String portCode);

    boolean existsByPortCode(String portCode);

    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId)")
    Page<Port> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId) " +
            "AND (CAST(:portCode AS string) IS NULL OR LOWER(p.portCode) LIKE LOWER(CONCAT('%', CAST(:portCode AS string), '%'))) " +
            "AND (CAST(:portName AS string) IS NULL OR LOWER(p.portName) LIKE LOWER(CONCAT('%', CAST(:portName AS string), '%'))) " +
            "AND (CAST(:province AS string) IS NULL OR LOWER(p.province) LIKE LOWER(CONCAT('%', CAST(:province AS string), '%'))) " +
            "AND (:operationalStatus IS NULL OR p.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(p.portCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.portName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))))")
    Page<Port> searchPorts(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("portCode") String portCode,
            @Param("portName") String portName,
            @Param("province") String province,
            @Param("operationalStatus") TrangThaiHoatDong operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("search") String search,
            Pageable pageable);
}
