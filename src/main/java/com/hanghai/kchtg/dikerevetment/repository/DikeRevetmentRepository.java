package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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

    List<DikeRevetment> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<DikeRevetment> findByDeletedAtIsNull(Sort sort);

    Page<DikeRevetment> findByDeletedAtIsNull(Pageable pageable);

    List<DikeRevetment> findByDikeRevetmentTypeAndDeletedAtIsNull(DikeRevetmentType dikeRevetmentType);

    List<DikeRevetment> findByLocationContainingAndDeletedAtIsNull(String location);

    @Query("SELECT d FROM DikeRevetment d WHERE " +
            "d.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(d.location) LIKE :keyword) AND " +
            "(:dikeRevetmentType IS NULL OR d.dikeRevetmentType = :dikeRevetmentType) AND " +
            "(:status IS NULL OR d.status = :status) AND " +
            "(:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus)")
    Page<DikeRevetment> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("dikeRevetmentType") DikeRevetmentType dikeRevetmentType,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);
}
