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

    List<RadarStation> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<RadarStation> findByVtsSystemId(UUID vtsSystemId);

    long countByVtsSystemId(UUID vtsSystemId);

    @Query("""
        SELECT t FROM RadarStation t
        WHERE t.deletedAt IS NULL
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR
            LOWER(t.stationName) LIKE :keyword OR
            LOWER(t.location) LIKE :keyword OR
            LOWER(t.stationType) LIKE :keyword)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        ORDER BY t.createdAt DESC
    """)
    Page<RadarStation> search(
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") String conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        Pageable pageable
    );

    @Query("""
        SELECT t FROM RadarStation t
        WHERE t.deletedAt IS NULL
          AND (:keyword IS NULL OR
            LOWER(t.stationName) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) OR
            LOWER(t.code) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:seaportId IS NULL OR t.seaportId = :seaportId)
          AND (:vtsSystemId IS NULL OR t.vtsSystemId = :vtsSystemId)
          AND (:vtsOperationCenterId IS NULL OR t.vtsOperationCenterId = :vtsOperationCenterId)
          AND (:operatingUnitId IS NULL OR t.operatingUnitId = :operatingUnitId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
          AND (:status IS NULL OR t.status = :status)
          AND (:updatedBy IS NULL OR t.updatedBy = :updatedBy)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
    """)
    Page<RadarStation> searchPaged(
        @Param("keyword") String keyword,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("seaportId") UUID seaportId,
        @Param("vtsSystemId") UUID vtsSystemId,
        @Param("vtsOperationCenterId") UUID vtsOperationCenterId,
        @Param("operatingUnitId") UUID operatingUnitId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") String conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("status") String status,
        @Param("updatedBy") UUID updatedBy,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    @Query("SELECT t FROM RadarStation t WHERE " +
           "t.deletedAt IS NULL AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(t.stationName) LIKE :search OR LOWER(t.location) LIKE :search)")
    List<RadarStation> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
