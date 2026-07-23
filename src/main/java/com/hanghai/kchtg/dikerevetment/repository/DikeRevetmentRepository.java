package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DikeRevetmentRepository extends JpaRepository<DikeRevetment, java.util.UUID> {

    List<DikeRevetment> findByApprovalStatusAndIsDeletedFalse(DikeRevetmentApprovalStatus approvalStatus);

    List<DikeRevetment> findByIsDeletedFalse(Sort sort);

    Page<DikeRevetment> findByIsDeletedFalse(Pageable pageable);

    List<DikeRevetment> findByDikeRevetmentTypeAndIsDeletedFalse(DikeRevetmentType dikeRevetmentType);

    List<DikeRevetment> findByLocationContainingAndIsDeletedFalse(String location);

    @Query("SELECT d FROM DikeRevetment d WHERE " +
            "(:orgUnitId IS NULL OR d.donViId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(d.location) LIKE :keyword) AND " +
            "(:dikeRevetmentType IS NULL OR d.dikeRevetmentType = :dikeRevetmentType) AND " +
            "(:status IS NULL OR d.status = :status) AND " +
            "(:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus) AND " +
            "d.isDeleted = false")
    Page<DikeRevetment> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") java.util.UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("dikeRevetmentType") DikeRevetmentType dikeRevetmentType,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("approvalStatus") DikeRevetmentApprovalStatus approvalStatus,
            Pageable pageable);
}
