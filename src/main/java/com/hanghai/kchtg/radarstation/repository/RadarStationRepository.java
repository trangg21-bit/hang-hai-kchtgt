package com.hanghai.kchtg.radarstation.repository;

import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RadarStationRepository extends JpaRepository<RadarStation, java.util.UUID> {

    List<RadarStation> findByApprovalStatusAndIsDeletedFalse(RadarStationApprovalStatus approvalStatus);

    List<RadarStation> findByVtsSystemId(java.util.UUID vtsSystemId);

    long countByVtsSystemId(java.util.UUID vtsSystemId);

    @Query("""
        SELECT t FROM RadarStation t
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR
            LOWER(t.stationName) LIKE :keyword OR
            LOWER(t.location) LIKE :keyword OR
            LOWER(t.stationType) LIKE :keyword)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        ORDER BY t.createdDate DESC
    """)
    Page<RadarStation> search(
        @Param("orgUnitId") java.util.UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") String conditionStatus,
        @Param("approvalStatus") RadarStationApprovalStatus approvalStatus,
        Pageable pageable
    );

    @Query("SELECT t FROM RadarStation t WHERE " +
           "t.isDeleted = false AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(t.stationName) LIKE :search OR LOWER(t.location) LIKE :search)")
    List<RadarStation> searchFiltered(
            @Param("orgUnitId") java.util.UUID orgUnitId,
            @Param("search") String search);
}
