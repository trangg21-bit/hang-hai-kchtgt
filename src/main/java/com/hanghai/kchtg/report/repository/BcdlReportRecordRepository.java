package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.BcdlReportRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho {@link BcdlReportRecord} (F-163 đến F-169).
 */
@Repository
public interface BcdlReportRecordRepository
        extends JpaRepository<BcdlReportRecord, UUID>, JpaSpecificationExecutor<BcdlReportRecord> {

    Optional<BcdlReportRecord> findByOrgUnitIdAndReportCodeAndReportPeriod(
            UUID orgUnitId, String reportCode, String reportPeriod);
}
