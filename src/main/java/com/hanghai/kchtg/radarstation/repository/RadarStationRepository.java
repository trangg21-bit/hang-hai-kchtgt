package com.hanghai.kchtg.radarstation.repository;

import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RadarStationRepository extends JpaRepository<RadarStation, UUID> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<RadarStation> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<RadarStation> findByVtsSystemIdAndDeletedAtIsNull(UUID vtsSystemId);

    long countByVtsSystemIdAndDeletedAtIsNull(UUID vtsSystemId);

    @Query("""
        SELECT t FROM RadarStation t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:seaportId IS NULL OR t.seaportId = :seaportId)
          AND (:vtsSystemId IS NULL OR t.vtsSystemId = :vtsSystemId)
          AND (:vtsOperationCenterId IS NULL OR t.vtsOperationCenterId = :vtsOperationCenterId)
          AND (:operatingUnitId IS NULL OR t.operatingUnitId = :operatingUnitId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:keyword IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.stationName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.location)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.stationType)) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PENDING_APPROVAL AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED))
          AND (:updatedBy IS NULL OR t.updatedBy = :updatedBy)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
        ORDER BY t.createdAt DESC
    """)
    Page<RadarStation> searchPaged(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("seaportId") UUID seaportId,
        @Param("vtsSystemId") UUID vtsSystemId,
        @Param("vtsOperationCenterId") UUID vtsOperationCenterId,
        @Param("operatingUnitId") UUID operatingUnitId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") String conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("updatedBy") UUID updatedBy,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM RadarStation t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(t.stationName)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.location)) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") String conditionStatus
    );

    @Query("""
        SELECT t FROM RadarStation t
        WHERE t.deletedAt IS NULL
          AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (t.conditionStatus = '1' OR t.conditionStatus = 'OPERATIONAL' OR t.conditionStatus IS NULL)
        ORDER BY t.stationName ASC
    """)
    List<RadarStation> findAllApprovedOptions(@Param("orgUnitId") UUID orgUnitId);

    @Query("SELECT t FROM RadarStation t WHERE " +
           "t.deletedAt IS NULL AND " +
           "t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR CAST(function('immutable_unaccent', LOWER(t.stationName)) AS string) LIKE CAST(:search AS string) OR CAST(function('immutable_unaccent', LOWER(t.location)) AS string) LIKE CAST(:search AS string))")
    List<RadarStation> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}

