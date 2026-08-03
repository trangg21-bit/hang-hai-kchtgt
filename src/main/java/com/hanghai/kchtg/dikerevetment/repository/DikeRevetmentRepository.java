package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DikeRevetmentRepository extends JpaRepository<DikeRevetment, UUID> {

    List<DikeRevetment> findByApprovalStatusAndIsDeletedFalse(DikeRevetmentApprovalStatus approvalStatus);

    List<DikeRevetment> findByIsDeletedFalse(Sort sort);

    Page<DikeRevetment> findByIsDeletedFalse(Pageable pageable);

    List<DikeRevetment> findByDikeRevetmentTypeAndIsDeletedFalse(DikeRevetmentType dikeRevetmentType);

    List<DikeRevetment> findByLocationContainingAndIsDeletedFalse(String location);

    @Query("SELECT d FROM DikeRevetment d WHERE " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(d.location) LIKE :keyword) AND " +
            "(:dikeRevetmentType IS NULL OR d.dikeRevetmentType = :dikeRevetmentType) AND " +
            "(:status IS NULL OR d.status = :status) AND " +
            "(:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus) AND " +
            "d.isDeleted = false")
    Page<DikeRevetment> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("dikeRevetmentType") DikeRevetmentType dikeRevetmentType,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("approvalStatus") DikeRevetmentApprovalStatus approvalStatus,
            Pageable pageable);
}
