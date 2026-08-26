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
            "l.deletedAt IS NULL AND " +
            "(:orgUnitId IS NULL OR l.orgUnitId = :orgUnitId) AND " +
            "(:seaportId IS NULL OR l.seaportId = :seaportId) AND " +
            "(:provinceId IS NULL OR l.provinceId = :provinceId) AND " +
            "(:conditionStatus IS NULL OR l.conditionStatus = :conditionStatus) AND " +
            "(:keyword IS NULL OR LOWER(l.channelName) LIKE :keyword) AND " +
            "(:approvalStatus IS NULL OR l.approvalStatus = :approvalStatus)")
    Page<NavigationChannel> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") UUID orgUnitId,
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
}
