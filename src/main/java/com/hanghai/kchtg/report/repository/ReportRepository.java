package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.BaseReport;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for BaseReport entity and all joined subtypes.
 * Provides queries by code, type, and status with pagination support.
 */
@Repository
public interface ReportRepository extends JpaRepository<BaseReport, UUID> {

    Optional<BaseReport> findByCode(String code);

    List<BaseReport> findByReportType(ReportType reportType);

    Page<BaseReport> findByStatus(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);
}
