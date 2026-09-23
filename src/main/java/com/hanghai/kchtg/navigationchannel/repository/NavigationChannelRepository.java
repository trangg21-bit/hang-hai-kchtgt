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
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelOptionResponse;

@Repository
public interface NavigationChannelRepository extends JpaRepository<NavigationChannel, UUID> {

    long countByOrgUnitId(UUID orgUnitId);

    List<NavigationChannel> findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    List<NavigationChannel> findByDeletedAtIsNull(Sort sort);

    Page<NavigationChannel> findByDeletedAtIsNull(Pageable pageable);

    List<NavigationChannel> findByChannelNameContainingAndDeletedAtIsNull(String channelName);

    @Query(value = "SELECT l FROM NavigationChannel l " +
            "LEFT JOIN OrgUnit o ON o.id = l.orgUnitId " +
            "LEFT JOIN Port p ON p.id = l.seaportId " +
            "LEFT JOIN OrgUnit op ON op.id = l.operatingUnitId " +
            "LEFT JOIN Province pv ON pv.id = l.provinceId " +
            "WHERE " +
            "(:approvalStatus IS NULL " +
            "  OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)) " +
            "  OR (l.deletedAt IS NULL AND l.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (" +
            "      l.approvalStatus = :approvalStatus " +
            "      OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)) " +
            "  )) " +
            ") AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(CAST(:keyword AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(CAST(:channelCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(l.channelCode, ''))) AS string) LIKE CAST(:channelCode AS string)) AND " +
            "(CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR l.updatedAt <= :updatedTo)",
            countQuery = "SELECT COUNT(l) FROM NavigationChannel l WHERE " +
            "(:approvalStatus IS NULL " +
            "  OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)) " +
            "  OR (l.deletedAt IS NULL AND l.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (" +
            "      l.approvalStatus = :approvalStatus " +
            "      OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)) " +
            "  )) " +
            ") AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(CAST(:keyword AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(CAST(:channelCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(l.channelCode, ''))) AS string) LIKE CAST(:channelCode AS string)) AND " +
            "(CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR l.updatedAt <= :updatedTo)")
    Page<NavigationChannel> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("seaportId") UUID seaportId,
            @org.springframework.data.repository.query.Param("provinceId") Integer provinceId,
            @org.springframework.data.repository.query.Param("conditionStatus") ConditionStatus conditionStatus,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("channelCode") String channelCode,
            @org.springframework.data.repository.query.Param("approvalStatus") ApprovalStatus approvalStatus,
            @org.springframework.data.repository.query.Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @org.springframework.data.repository.query.Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);

    @Query(value = "SELECT l FROM NavigationChannel l " +
            "LEFT JOIN OrgUnit o ON o.id = l.orgUnitId " +
            "LEFT JOIN Port p ON p.id = l.seaportId " +
            "LEFT JOIN OrgUnit op ON op.id = l.operatingUnitId " +
            "LEFT JOIN Province pv ON pv.id = l.provinceId " +
            "WHERE " +
            "(:approvalStatus IS NULL " +
            "  OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)) " +
            "  OR (l.deletedAt IS NULL AND l.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (" +
            "      l.approvalStatus = :approvalStatus " +
            "      OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)) " +
            "  )) " +
            ") AND " +
            "(:#{#orgUnitIds == null || #orgUnitIds.isEmpty()} = true OR l.orgUnitId IN :orgUnitIds) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(CAST(:keyword AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(CAST(:channelCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(l.channelCode, ''))) AS string) LIKE CAST(:channelCode AS string)) AND " +
            "(CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR l.updatedAt <= :updatedTo)",
            countQuery = "SELECT COUNT(l) FROM NavigationChannel l WHERE " +
            "(:approvalStatus IS NULL " +
            "  OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)) " +
            "  OR (l.deletedAt IS NULL AND l.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND (" +
            "      l.approvalStatus = :approvalStatus " +
            "      OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)) " +
            "  )) " +
            ") AND " +
            "(:#{#orgUnitIds == null || #orgUnitIds.isEmpty()} = true OR l.orgUnitId IN :orgUnitIds) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(CAST(:keyword AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(CAST(:channelCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(l.channelCode, ''))) AS string) LIKE CAST(:channelCode AS string)) AND " +
            "(CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR l.updatedAt <= :updatedTo)")
    Page<NavigationChannel> searchDocumentsByOrgUnitIds(
            @org.springframework.data.repository.query.Param("orgUnitIds") java.util.Collection<UUID> orgUnitIds,
            @org.springframework.data.repository.query.Param("seaportId") UUID seaportId,
            @org.springframework.data.repository.query.Param("provinceId") Integer provinceId,
            @org.springframework.data.repository.query.Param("conditionStatus") ConditionStatus conditionStatus,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("channelCode") String channelCode,
            @org.springframework.data.repository.query.Param("approvalStatus") ApprovalStatus approvalStatus,
            @org.springframework.data.repository.query.Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @org.springframework.data.repository.query.Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);
    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(l.channelName) LIKE :search)")
    List<NavigationChannel> searchFiltered(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("search") String search);

    @Query("SELECT CASE WHEN (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED) THEN com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED ELSE l.approvalStatus END, COUNT(l) " +
            "FROM NavigationChannel l WHERE " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(CAST(:keyword AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(CAST(:channelCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(l.channelCode, ''))) AS string) LIKE CAST(:channelCode AS string)) AND " +
            "(CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR l.updatedAt <= :updatedTo) " +
            "GROUP BY CASE WHEN (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED) THEN com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED ELSE l.approvalStatus END")
    List<Object[]> countByApprovalStatus(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("seaportId") UUID seaportId,
            @org.springframework.data.repository.query.Param("provinceId") Integer provinceId,
            @org.springframework.data.repository.query.Param("conditionStatus") ConditionStatus conditionStatus,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("channelCode") String channelCode,
            @org.springframework.data.repository.query.Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @org.springframework.data.repository.query.Param("updatedTo") java.time.LocalDateTime updatedTo);

    @Query("SELECT CASE WHEN (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED) THEN com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED ELSE l.approvalStatus END, COUNT(l) " +
            "FROM NavigationChannel l WHERE " +
            "(:#{#orgUnitIds == null || #orgUnitIds.isEmpty()} = true OR l.orgUnitId IN :orgUnitIds) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(CAST(:keyword AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(l.channelName)) AS string) LIKE CAST(:keyword AS string)) AND " +
            "(CAST(:channelCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(l.channelCode, ''))) AS string) LIKE CAST(:channelCode AS string)) AND " +
            "(CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR l.updatedAt >= :updatedFrom) AND " +
            "(CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR l.updatedAt <= :updatedTo) " +
            "GROUP BY CASE WHEN (l.deletedAt IS NOT NULL OR l.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED) THEN com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED ELSE l.approvalStatus END")
    List<Object[]> countByApprovalStatusByOrgUnitIds(
            @org.springframework.data.repository.query.Param("orgUnitIds") java.util.Collection<UUID> orgUnitIds,
            @org.springframework.data.repository.query.Param("seaportId") UUID seaportId,
            @org.springframework.data.repository.query.Param("provinceId") Integer provinceId,
            @org.springframework.data.repository.query.Param("conditionStatus") ConditionStatus conditionStatus,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("channelCode") String channelCode,
            @org.springframework.data.repository.query.Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @org.springframework.data.repository.query.Param("updatedTo") java.time.LocalDateTime updatedTo);

    @Query("SELECT l.channelCode FROM NavigationChannel l WHERE (:orgUnitId IS NULL AND l.orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND l.channelCode IS NOT NULL AND l.deletedAt IS NULL")
    List<String> findActiveChannelCodesByOrgUnitId(@org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId);

    @Query("SELECT COUNT(l) > 0 FROM NavigationChannel l WHERE (:orgUnitId IS NULL AND l.orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND l.channelCode = :channelCode AND l.deletedAt IS NULL")
    boolean existsActiveByOrgUnitIdAndChannelCode(@org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId, @org.springframework.data.repository.query.Param("channelCode") String channelCode);

    @Query("SELECT new com.hanghai.kchtg.navigationchannel.dto.NavigationChannelOptionResponse(" +
            "l.id, l.channelCode, l.channelName, l.orgUnitId, l.seaportId) " +
            "FROM NavigationChannel l WHERE l.deletedAt IS NULL " +
            "ORDER BY l.channelName ASC")
    List<NavigationChannelOptionResponse> findAllOptions();

    @Query("SELECT new com.hanghai.kchtg.navigationchannel.dto.NavigationChannelOptionResponse(" +
            "l.id, l.channelCode, l.channelName, l.orgUnitId, l.seaportId) " +
            "FROM NavigationChannel l WHERE l.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) " +
            "ORDER BY l.channelName ASC")
    List<NavigationChannelOptionResponse> findOptionsByOrgUnitId(@org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId);
}
