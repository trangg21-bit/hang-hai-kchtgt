package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.Bcc157Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for BCC_157 (F-142) reports.
 */
@Repository
public interface Bcc157ReportRepository extends JpaRepository<Bcc157Report, UUID> {

    Optional<Bcc157Report> findByOrgUnitIdAndReportYearAndNguonDuLieu(
            UUID orgUnitId, Integer reportYear, String nguonDuLieu);

    List<Bcc157Report> findByOrgUnitIdAndReportYear(UUID orgUnitId, Integer reportYear);

    List<Bcc157Report> findByReportYear(Integer reportYear);

    List<Bcc157Report> findByOrgUnitId(UUID orgUnitId);

    List<Bcc157Report> findByNguonDuLieu(String nguonDuLieu);
}
