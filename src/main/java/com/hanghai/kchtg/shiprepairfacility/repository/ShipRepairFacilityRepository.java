package com.hanghai.kchtg.shiprepairfacility.repository;

import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacility;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipRepairFacilityRepository extends JpaRepository<ShipRepairFacility, java.util.UUID> {

    List<ShipRepairFacility> findByApprovalStatusAndIsDeletedFalse(ShipRepairApprovalStatus approvalStatus);

    @Query("SELECT c FROM ShipRepairFacility c WHERE " +
            "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(c.facilityName) LIKE :keyword OR LOWER(c.address) LIKE :keyword OR LOWER(c.province) LIKE :keyword) AND " +
            "(:province IS NULL OR LOWER(c.province) LIKE :province) AND " +
            "(:approvalStatus IS NULL OR c.approvalStatus = :approvalStatus) AND " +
            "(:approvalStatusPheDuyet IS NULL OR c.approvalStatus = :approvalStatusPheDuyet) AND " +
            "c.isDeleted = false")
    List<ShipRepairFacility> search(@Param("orgUnitId") java.util.UUID orgUnitId,
                                    @Param("keyword") String keyword,
                                    @Param("province") String province,
                                    @Param("approvalStatus") ShipRepairApprovalStatus approvalStatus,
                                    @Param("approvalStatusPheDuyet") ShipRepairApprovalStatus approvalStatusPheDuyet);
    @Query("SELECT c FROM ShipRepairFacility c WHERE " +
           "c.isDeleted = false AND " +
           "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(c.facilityName) LIKE :search OR LOWER(c.address) LIKE :search)")
    List<ShipRepairFacility> searchFiltered(
            @Param("orgUnitId") java.util.UUID orgUnitId,
            @Param("search") String search);
}
