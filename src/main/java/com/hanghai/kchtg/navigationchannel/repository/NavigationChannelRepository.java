package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NavigationChannelRepository extends JpaRepository<NavigationChannel, UUID> {

    long countByOrgUnitId(UUID orgUnitId);

    List<NavigationChannel> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<NavigationChannel> findByDeletedAtIsNull(Sort sort);

    Page<NavigationChannel> findByDeletedAtIsNull(Pageable pageable);

    List<NavigationChannel> findByChannelNameContainingAndDeletedAtIsNull(String channelName);

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "((:approvalStatus IS NULL) " +
            "  OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)) " +
            "  OR (l.deletedAt IS NULL AND l.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (" +
            "      l.approvalStatus = :approvalStatus " +
            "      OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)) " +
            "  )) " +
            ") AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(:keyword IS NULL OR LOWER(l.channelName) LIKE :keyword)")
    Page<NavigationChannel> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("seaportId") UUID seaportId,
            @org.springframework.data.repository.query.Param("provinceId") Integer provinceId,
            @org.springframework.data.repository.query.Param("conditionStatus") ConditionStatus conditionStatus,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "((:approvalStatus IS NULL) " +
            "  OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)) " +
            "  OR (l.deletedAt IS NULL AND l.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (" +
            "      l.approvalStatus = :approvalStatus " +
            "      OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)) " +
            "  )) " +
            ") AND " +
            "(:#{#orgUnitIds == null || #orgUnitIds.isEmpty()} = true OR l.orgUnitId IN :orgUnitIds) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(:keyword IS NULL OR LOWER(l.channelName) LIKE :keyword)")
    Page<NavigationChannel> searchDocumentsByOrgUnitIds(
            @org.springframework.data.repository.query.Param("orgUnitIds") java.util.Collection<UUID> orgUnitIds,
            @org.springframework.data.repository.query.Param("seaportId") UUID seaportId,
            @org.springframework.data.repository.query.Param("provinceId") Integer provinceId,
            @org.springframework.data.repository.query.Param("conditionStatus") ConditionStatus conditionStatus,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);
    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(l.channelName) LIKE :search)")
    List<NavigationChannel> searchFiltered(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("search") String search);

    @Query("SELECT new com.hanghai.kchtg.navigationchannel.dto.NavigationChannelOptionResponse(" +
            "l.id, l.channelCode, l.channelName, l.orgUnitId, l.seaportId) " +
            "FROM NavigationChannel l WHERE l.deletedAt IS NULL " +
            "AND l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED " +
            "ORDER BY l.channelName ASC")
    List<com.hanghai.kchtg.navigationchannel.dto.NavigationChannelOptionResponse> findActiveOptions();
}
