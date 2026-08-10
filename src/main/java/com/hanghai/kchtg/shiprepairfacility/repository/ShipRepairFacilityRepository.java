package com.hanghai.kchtg.shiprepairfacility.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShipRepairFacilityRepository extends JpaRepository<ShipRepairFacility, UUID> {

    List<ShipRepairFacility> findByApprovalStatusAndIsDeletedFalse(ApprovalStatus approvalStatus);

    @Query("SELECT c FROM ShipRepairFacility c WHERE " +
            "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(c.facilityName) LIKE :keyword OR LOWER(c.address) LIKE :keyword) AND " +
            "(:provinceId IS NULL OR c.provinceId = :provinceId) AND " +
            "(:approvalStatus IS NULL OR c.approvalStatus = :approvalStatus) AND " +
            "(:reviewStatus IS NULL OR c.approvalStatus = :reviewStatus) AND " +
            "c.isDeleted = false")
    List<ShipRepairFacility> search(@Param("orgUnitId") UUID orgUnitId,
                                    @Param("keyword") String keyword,
                                    @Param("provinceId") Integer provinceId,
                                    @Param("approvalStatus") ApprovalStatus approvalStatus,
                                    @Param("reviewStatus") ApprovalStatus reviewStatus);
    @Query("SELECT c FROM ShipRepairFacility c WHERE " +
           "c.isDeleted = false AND " +
           "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(c.facilityName) LIKE :search OR LOWER(c.address) LIKE :search)")
    List<ShipRepairFacility> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
