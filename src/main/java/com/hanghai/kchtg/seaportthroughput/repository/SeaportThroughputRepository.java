package com.hanghai.kchtg.seaportthroughput.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.seaportthroughput.entity.SeaportThroughput;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SeaportThroughputRepository extends JpaRepository<SeaportThroughput, UUID> {

    boolean existsByOrgUnitIdAndReportMonth(UUID orgUnitId, LocalDate reportMonth);

    boolean existsByOrgUnitIdAndReportMonthAndIdNot(UUID orgUnitId, LocalDate reportMonth, UUID id);

    /**
     * Tìm kiếm + lọc danh sách. DataScope (orgUnitFilter) được kích hoạt bởi {@code @DataScope}
     * trên controller; bộ lọc trạng thái luôn được truyền danh sách không rỗng.
     */
    @Query("""
            select s from SeaportThroughput s
            where s.approvalStatus in :statuses
              and (:orgUnitId is null or s.orgUnitId = :orgUnitId)
              and (:reportMonth is null or s.reportMonth = :reportMonth)
              and (:updatedFrom is null or s.updatedAt >= :updatedFrom)
              and (:updatedTo is null or s.updatedAt <= :updatedTo)
              and (:keyword is null or lower(coalesce(s.note, '')) like lower(concat('%', :keyword, '%')))
            """)
    Page<SeaportThroughput> search(@Param("statuses") List<ApprovalStatus> statuses,
                                   @Param("orgUnitId") UUID orgUnitId,
                                   @Param("reportMonth") LocalDate reportMonth,
                                   @Param("updatedFrom") LocalDateTime updatedFrom,
                                   @Param("updatedTo") LocalDateTime updatedTo,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);
}
