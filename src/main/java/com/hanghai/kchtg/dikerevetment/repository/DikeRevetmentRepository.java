package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface DikeRevetmentRepository extends JpaRepository<DikeRevetment, UUID> {

    List<DikeRevetment> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<DikeRevetment> findByDeletedAtIsNull(Sort sort);

    Page<DikeRevetment> findByDeletedAtIsNull(Pageable pageable);

    List<DikeRevetment> findByDikeRevetmentTypeAndDeletedAtIsNull(DikeRevetmentType dikeRevetmentType);

    List<DikeRevetment> findByLocationContainingAndDeletedAtIsNull(String location);

    @Query("SELECT MAX(d.code) FROM DikeRevetment d WHERE d.code IS NOT NULL")
    String findMaxCode();

    @Query("SELECT d FROM DikeRevetment d WHERE " +
            "d.deletedAt IS NULL AND " +
            "(:scopeEnabled = false OR d.orgUnitId IN :scopeOrgUnitIds) AND " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR d.seaportId = :seaportId) AND " +
            "(:dikeRevetmentType IS NULL OR d.dikeRevetmentType = :dikeRevetmentType) AND " +
            "(:conditionStatus IS NULL OR d.status = :conditionStatus) AND " +
            "(:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus) AND " +
            "(:updatedBy IS NULL OR d.updatedBy = :updatedBy) AND " +
            "(CAST(:updatedFrom AS timestamp) IS NULL OR d.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS timestamp) IS NULL OR d.updatedAt <= :updatedTo) AND " +
            "(CAST(:keyword AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.dikeRevetmentName)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.code)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.location)) AS string) LIKE CAST(:keyword AS string))")
    Page<DikeRevetment> searchPaged(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("seaportId") UUID seaportId,
            @Param("dikeRevetmentType") DikeRevetmentType dikeRevetmentType,
            @Param("conditionStatus") String conditionStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("updatedBy") UUID updatedBy,
            @Param("updatedFrom") LocalDateTime updatedFrom,
            @Param("updatedTo") LocalDateTime updatedTo,
            Pageable pageable);

    @Query("SELECT d.approvalStatus, COUNT(d) FROM DikeRevetment d WHERE " +
            "d.deletedAt IS NULL AND " +
            "(:scopeEnabled = false OR d.orgUnitId IN :scopeOrgUnitIds) AND " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) AND " +
            "(CAST(:keyword AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.dikeRevetmentName)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.code)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.location)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(:conditionStatus IS NULL OR d.status = :conditionStatus) " +
            "GROUP BY d.approvalStatus")
    List<Object[]> countByApprovalStatus(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("conditionStatus") String conditionStatus);

    @Query("SELECT d FROM DikeRevetment d WHERE " +
            "d.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) AND " +
            "(CAST(:keyword AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.dikeRevetmentName)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.code)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.location)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(:status IS NULL OR d.status = :status) AND " +
            "(:dikeRevetmentType IS NULL OR d.dikeRevetmentType = :dikeRevetmentType) AND " +
            "(:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus)")
    Page<DikeRevetment> searchDocuments(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("dikeRevetmentType") DikeRevetmentType dikeRevetmentType,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);

    @Query("SELECT d FROM DikeRevetment d WHERE " +
            "d.deletedAt IS NULL AND " +
            "(d.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR d.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2) AND " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) " +
            "ORDER BY d.dikeRevetmentName ASC")
    List<DikeRevetment> findAllApprovedOptions(@Param("orgUnitId") UUID orgUnitId);
}
