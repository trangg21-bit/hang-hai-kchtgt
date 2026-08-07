package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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

    List<NavigationChannel> findByApprovalStatusAndIsDeletedFalse(ApprovalStatus approvalStatus);

    List<NavigationChannel> findByIsDeletedFalse(Sort sort);

    Page<NavigationChannel> findByIsDeletedFalse(Pageable pageable);

    List<NavigationChannel> findByChannelNameContainingAndIsDeletedFalse(String channelName);

    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(l.channelName) LIKE :keyword) AND " +
            "(:ApprovalStatus IS NULL OR l.approvalStatus = :ApprovalStatus) AND " +
            "l.isDeleted = false")
    Page<NavigationChannel> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("ApprovalStatus") ApprovalStatus ApprovalStatus,
            Pageable pageable);
    @Query("SELECT l FROM NavigationChannel l WHERE " +
            "l.isDeleted = false AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(l.channelName) LIKE :search)")
    List<NavigationChannel> searchFiltered(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
            @org.springframework.data.repository.query.Param("search") String search);
}
