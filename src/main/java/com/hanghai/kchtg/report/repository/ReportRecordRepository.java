package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.ReportRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho {@link ReportRecord} (BCPTTV, BCDN, BCTT48...).
 */
@Repository
public interface ReportRecordRepository
        extends JpaRepository<ReportRecord, UUID>, JpaSpecificationExecutor<ReportRecord> {

    Optional<ReportRecord> findByOrgUnitIdAndReportCodeAndReportYearAndReportPeriod(
            UUID orgUnitId, String reportCode, Integer reportYear, String reportPeriod);

    List<ReportRecord> findByReportCodeAndReportYear(String reportCode, Integer reportYear);

    List<ReportRecord> findByOrgUnitIdAndReportCode(UUID orgUnitId, String reportCode);
}
