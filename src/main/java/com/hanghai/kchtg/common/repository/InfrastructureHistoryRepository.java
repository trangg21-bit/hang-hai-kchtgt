package com.hanghai.kchtg.common.repository;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository("commonInfrastructureHistoryRepository")
public interface InfrastructureHistoryRepository extends JpaRepository<InfrastructureHistory, UUID>,
        JpaSpecificationExecutor<InfrastructureHistory> {

    List<InfrastructureHistory> findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType refType, UUID refId);

    List<InfrastructureHistory> findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType refType, UUID refId, Pageable pageable);

    List<InfrastructureHistory> findByRefTypeOrderByApprovedDateDesc(InfrastructureType refType);

    @Query("""
            SELECT h FROM InfrastructureHistory h
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
    List<InfrastructureHistory> searchHistory(
            @Param("refType") InfrastructureType refType,
            @Param("refId") UUID refId,
            @Param("keyword") String keyword,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    List<InfrastructureHistory> findByRefIdOrderByApprovedDateDesc(UUID refId);

    List<InfrastructureHistory> findByRefIdOrderByApprovedDateDesc(UUID refId, Pageable pageable);
}
