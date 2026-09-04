package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho Đài thông tin vệ tinh Inmarsat (F-098..F-103).
 */
@Repository
public interface CoastalStationInmarsatRepository extends JpaRepository<CoastalStationInmarsat, UUID> {

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationInmarsat> findByDeviceCode(@Param("code") String code);

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationInmarsat> findByCode(@Param("code") String code);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.deletedAt IS NULL")
    List<CoastalStationInmarsat> findAllActive();

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.deletedAt IS NULL")
    List<CoastalStationInmarsat> findByDeletedAtIsNull();

    /**
     * Danh sách đài Inmarsat.
     *
     * KHÔNG đặt ORDER BY cố định: JPA nối ORDER BY của {@link Pageable} vào SAU
     * mệnh đề có sẵn, nên cố định ở đây là vô hiệu hóa cột người dùng chọn.
     */
    @Query("""
        SELECT t FROM CoastalStationInmarsat t
        LEFT JOIN OrgUnit o ON o.id = t.orgUnitId
        LEFT JOIN OperatingOrganization oo ON oo.id = t.operatingOrgId
        LEFT JOIN OrgUnit oorg ON oorg.id = t.operatingOrgId
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string))
          AND (CAST(:name AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, ''))) AS string) LIKE CAST(:name AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:code AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PENDING_APPROVAL AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED))
          AND (:updatedBy IS NULL OR t.updatedBy = :updatedBy)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
    """)
    Page<CoastalStationInmarsat> searchPaged(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("name") String name,
        @Param("code") String code,
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("updatedBy") UUID updatedBy,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM CoastalStationInmarsat t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (CAST(:name AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, ''))) AS string) LIKE CAST(:name AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:code AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("name") String name,
        @Param("code") String code,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("provinceId") Integer provinceId,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo
    );

    @Query("""
        SELECT t FROM CoastalStationInmarsat t
        WHERE t.deletedAt IS NULL
          AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (t.conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.OPERATIONAL OR t.conditionStatus IS NULL)
        ORDER BY t.name ASC
    """)
    List<CoastalStationInmarsat> findAllApprovedOptions(@Param("orgUnitId") UUID orgUnitId);

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE " +
            "c.deletedAt IS NULL AND " +
            "c.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND " +
            "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR " +
            " CAST(function('immutable_unaccent', LOWER(COALESCE(c.name, ''))) AS string) LIKE CAST(:search AS string) OR " +
            " CAST(function('immutable_unaccent', LOWER(COALESCE(c.code, ''))) AS string) LIKE CAST(:search AS string))")
    List<CoastalStationInmarsat> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);

    @Query("SELECT COUNT(c) FROM CoastalStationInmarsat c WHERE c.code LIKE :prefix%")
    long countByCodePrefix(@Param("prefix") String prefix);
}
