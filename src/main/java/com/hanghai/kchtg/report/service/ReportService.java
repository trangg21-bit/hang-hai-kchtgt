package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.entity.*;
import com.hanghai.kchtg.report.repository.ReportEntityRepository;
import com.hanghai.kchtg.report.repository.ReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service core cho quản lý báo cáo M-016 (Báo cáo & Tổng hợp).
 * Cung cấp CRUD, tra cứu, tạo báo cáo và tải file kết quả.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ReportService {

    private final ReportRepository reportRepo;
    private final ReportEntityRepository reportEntityRepo;

    /**
     * Tạo báo cáo mới với status = PENDING.
     * Nếu parameters == null, lưu Map rỗng.
     */
    @Transactional
    public ReportEntity createReport(ReportRequest request) {
        ReportEntity entity = ReportEntity.builder()
                .reportType(request.getReportType())
                .status(ReportStatus.PENDING)
                .outputFormat(request.getOutputFormat())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .parameters(Map.of().toString())
                .generatedAt(Instant.now())
                .build();
        entity = reportRepo.save(entity);
        log.info("Created report [{}] type={} status=PENDING",
                entity.getCode(), entity.getReportType());
        return entity;
    }

    /**
     * Cập nhật trạng thái báo cáo theo mã.
     */
    @Transactional
    public void updateReportStatus(String code, ReportStatus status) {
        ReportEntity entity = reportEntityRepo.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Report not found: " + code));
        entity.setStatus(status);
        if (status == ReportStatus.READY) {
            entity.setGeneratedAt(Instant.now());
        }
        reportEntityRepo.save(entity);
        log.info("Updated report [{}] -> {}", code, status);
    }

    /**
     * Tìm báo cáo theo mã (code).
     */
    public ReportEntity findByCode(String code) {
        return reportEntityRepo.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Report not found: " + code));
    }

    /**
     * Lấy danh sách phân trang toàn bộ báo cáo READY.
     */
    public Page<ReportEntity> findAll(Pageable pageable) {
        return reportEntityRepo.findByStatus(ReportStatus.READY, pageable);
    }

    /**
     * Tìm báo cáo theo loại.
     */
    public List<ReportEntity> findByReportType(ReportType type) {
        return reportEntityRepo.findByReportType(type);
    }

    /**
     * Đếm số báo cáo theo trạng thái.
     */
    public long countByStatus(ReportStatus status) {
        return reportEntityRepo.countByStatus(status);
    }

    /**
     * Chạy tác vụ sinh báo cáo bất đồng bộ (stub).
     * Log thông tin → cập nhật status = READY.
     */
    @Transactional
    public void generateReport(ReportRequest request) {
        log.info("generateReport() stub: type={} startDate={} endDate={} format={}",
                request.getReportType(), request.getStartDate(),
                request.getEndDate(), request.getOutputFormat());
        // TODO: implement actual report generation (POI, Jasper, etc.)
        // For now just set READY status on the last created report
        List<ReportEntity> latest = reportEntityRepo.findByReportType(request.getReportType());
        if (!latest.isEmpty()) {
            ReportEntity report = latest.get(latest.size() - 1);
            updateReportStatus(report.getCode(), ReportStatus.READY);
        }
    }

    /**
     * Tải file báo cáo theo mã (stub).
     * Trả về fileUrl đã lưu — TODO: tích hợp object storage / file system.
     */
    public String downloadReport(String code) {
        ReportEntity report = findByCode(code);
        String url = report.getFileUrl();
        if (url == null || url.isBlank()) {
            log.warn("downloadReport [{}]: fileUrl is empty", code);
            return null;
        }
        log.info("downloadReport [{}] -> {}", code, url);
        return url;
    }
}
