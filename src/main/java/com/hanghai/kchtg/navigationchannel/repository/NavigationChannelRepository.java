package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
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
public interface NavigationChannelRepository extends JpaRepository<NavigationChannel, UUID> {

    long countByOrgUnitId(UUID orgUnitId);

    List<NavigationChannel> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<NavigationChannel> findByDeletedAtIsNull(Sort sort);

    Page<NavigationChannel> findByDeletedAtIsNull(Pageable pageable);

    List<NavigationChannel> findByChannelNameContainingAndDeletedAtIsNull(String channelName);

    @Query("SELECT MAX(n.channelCode) FROM NavigationChannel n WHERE n.channelCode IS NOT NULL")
    String findMaxCode();

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(:scopeEnabled = false OR l.orgUnitId IN :scopeOrgUnitIds) AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:status IS NULL OR l.status = :status) AND " +
            "(:approvalStatus IS NULL OR l.approvalStatus = :approvalStatus) AND " +
            "(:updatedBy IS NULL OR l.updatedBy = :updatedBy) AND " +
            "(:updatedFrom IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(:updatedTo IS NULL OR l.updatedAt <= :updatedTo) AND " +
            "(:keyword IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.channelCode)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.detailedLocation)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.location)) AS string) LIKE CAST(:keyword AS string))")
    Page<NavigationChannel> searchPaged(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("seaportId") UUID seaportId,
            @Param("status") Integer status,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("updatedBy") UUID updatedBy,
            @Param("updatedFrom") LocalDateTime updatedFrom,
            @Param("updatedTo") LocalDateTime updatedTo,
            Pageable pageable);

    @Query("SELECT l.approvalStatus, COUNT(l) FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(:scopeEnabled = false OR l.orgUnitId IN :scopeOrgUnitIds) AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.channelCode)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.detailedLocation)) AS string) LIKE CAST(:keyword AS string) OR " +
            "  CAST(function('immutable_unaccent', LOWER(l.location)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(:status IS NULL OR l.status = :status) " +
            "GROUP BY l.approvalStatus")
    List<Object[]> countByApprovalStatus(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("status") Integer status);

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2) AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) " +
            "ORDER BY l.channelName ASC")
    List<NavigationChannel> findAllApprovedOptions(@Param("orgUnitId") UUID orgUnitId);

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(l.channelName) LIKE :keyword) AND " +
            "(:approvalStatus IS NULL OR l.approvalStatus = :approvalStatus)")
    Page<NavigationChannel> searchDocuments(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(l.channelName) LIKE :search)")
    List<NavigationChannel> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
