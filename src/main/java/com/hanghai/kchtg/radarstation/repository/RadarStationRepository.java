package com.hanghai.kchtg.radarstation.repository;

import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RadarStationRepository extends JpaRepository<RadarStation, UUID> {

    List<RadarStation> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<RadarStation> findByVtsSystemId(UUID vtsSystemId);

    long countByVtsSystemId(UUID vtsSystemId);

    @Query("""
        SELECT t FROM RadarStation t
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
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

    @Query("SELECT t FROM RadarStation t WHERE " +
           "t.deletedAt IS NULL AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(t.stationName) LIKE :search OR LOWER(t.location) LIKE :search)")
    List<RadarStation> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
