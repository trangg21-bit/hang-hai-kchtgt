package com.hanghai.kchtg.siem.repository;

import com.hanghai.kchtg.siem.entity.SiemReport;
import com.hanghai.kchtg.siem.entity.SiemReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SiemReportRepository extends JpaRepository<SiemReport, UUID> {

    /** All reports by format. */
    List<SiemReport> findByFormat(String format);

    /** All reports with a given status. */
    List<SiemReport> findByStatus(SiemReportStatus status);

    /** All scheduled reports. */
    List<SiemReport> findByScheduledTrue();

    /** Report versions for a specific format. */
    List<SiemReport> findByFormatAndStatus(String format, SiemReportStatus status);
}
