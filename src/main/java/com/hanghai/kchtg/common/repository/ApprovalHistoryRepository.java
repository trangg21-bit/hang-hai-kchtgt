package com.hanghai.kchtg.common.repository;

import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("commonApprovalHistoryRepository")
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    List<ApprovalHistory> findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType refType, UUID refId);

    List<ApprovalHistory> findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType refType, UUID refId, Pageable pageable);

    @Query("""
            SELECT h FROM ApprovalHistory h
            WHERE h.refType = :refType
              AND h.refId = :refId
              AND (COALESCE(CAST(:keyword AS string), '') = ''
                   OR CAST(function('immutable_unaccent', LOWER(CAST(COALESCE(h.changedField, '') AS string))) AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
                   OR CAST(function('immutable_unaccent', LOWER(CAST(COALESCE(h.previousValue, '') AS string))) AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
                   OR CAST(function('immutable_unaccent', LOWER(CAST(COALESCE(h.newValue, '') AS string))) AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
                   OR CAST(function('immutable_unaccent', LOWER(CAST(COALESCE(h.reason, '') AS string))) AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%'))
              AND h.approvedDate >= COALESCE(:fromDate, h.approvedDate)
              AND h.approvedDate <= COALESCE(:toDate, h.approvedDate)
            ORDER BY h.approvedDate DESC
            """)
    List<ApprovalHistory> searchHistory(
            @Param("refType") InfrastructureType refType,
            @Param("refId") UUID refId,
            @Param("keyword") String keyword,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);

    List<ApprovalHistory> findByRefIdOrderByApprovedDateDesc(UUID refId);

    List<ApprovalHistory> findByRefIdOrderByApprovedDateDesc(UUID refId, Pageable pageable);
}
