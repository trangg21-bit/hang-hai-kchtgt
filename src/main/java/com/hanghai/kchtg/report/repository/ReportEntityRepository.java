package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.ReportEntity;
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
 * Repository cho ReportEntity subtype (KCHTGT summary reports).
 * Mở rộng từ Wave 1 để hỗ trợ các truy vấn cần thiết cho Wave 2 DTO/Service.
 */
@Repository
public interface ReportEntityRepository extends JpaRepository<ReportEntity, UUID> {

    Optional<ReportEntity> findByCode(String code);

    List<ReportEntity> findByReportType(ReportType reportType);

    Page<ReportEntity> findByStatus(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);
}
