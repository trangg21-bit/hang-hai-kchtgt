package com.hanghai.kchtg.port.repository;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Port entity.
 * Supports org-unit filtering and code uniqueness checks.
 * Queries use legacy DB columns (operational_status, approval_status)
 * instead of the transient portStatus field.
 */
@Repository
public interface PortRepository extends JpaRepository<Port, UUID> {

    Optional<Port> findByPortCode(String portCode);

    boolean existsByPortCode(String portCode);

    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId)")
    Page<Port> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Port p WHERE p.deletedAt IS NULL AND p.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query(value = "SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(port_code, '^CB-0*', ''), '') AS INTEGER)), 0) FROM ports WHERE port_code ~ '^CB-[0-9]+$' AND deleted_at IS NULL", nativeQuery = true)
    Integer findMaxPortCodeNumber();

    @Query("SELECT p.approvalStatus, p.operationalStatus, COUNT(p) FROM Port p WHERE p.deletedAt IS NULL GROUP BY p.approvalStatus, p.operationalStatus")
    List<Object[]> countByStatusGroups();

    /**
     * Search ports filtering by legacy DB columns.
     * For operationalStatus null-check (NHAP status), pass operationalStatusNull=true.
     */
    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId) " +
            "AND (CAST(:portCode AS string) IS NULL OR LOWER(p.portCode) LIKE LOWER(CONCAT('%', CAST(:portCode AS string), '%'))) " +
            "AND (CAST(:portName AS string) IS NULL OR LOWER(p.portName) LIKE LOWER(CONCAT('%', CAST(:portName AS string), '%'))) " +
            "AND (CAST(:province AS string) IS NULL OR LOWER(p.province) LIKE LOWER(CONCAT('%', CAST(:province AS string), '%'))) " +
            "AND (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND p.operationalStatus IS NULL) OR (:operationalStatusNull = false AND (:operationalStatus IS NULL OR p.operationalStatus = :operationalStatus))) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(p.portCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.portName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))))")
    Page<Port> searchPorts(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("portCode") String portCode,
            @Param("portName") String portName,
            @Param("province") String province,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            @Param("search") String search,
            Pageable pageable);

    /**
     * @deprecated Use {@link #searchPorts(UUID, String, String, String, ApprovalStatus, OperationalStatus, boolean, String, Pageable)} instead.
     * Kept for backward compatibility with KchtGis155Service.
     */
    @Deprecated
    default Page<Port> searchPorts(UUID orgUnitId, String portCode, String portName, String province,
                                    OperationalStatus operationalStatus, ApprovalStatus approvalStatus,
                                    String search, Pageable pageable) {
        return searchPorts(orgUnitId, portCode, portName, province,
                approvalStatus, operationalStatus, false, search, pageable);
    }
}
