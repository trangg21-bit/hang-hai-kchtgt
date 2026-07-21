package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.dto.Bcc157CreateRequest;
import com.hanghai.kchtg.report.dto.Bcc157Response;
import com.hanghai.kchtg.report.dto.Bcc157SearchRequest;
import com.hanghai.kchtg.report.entity.Bcc157Report;
import com.hanghai.kchtg.report.repository.Bcc157ReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for BCC_157 (F-142) CRUD operations.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class Bcc157Service {

    private final Bcc157ReportRepository repository;

    /**
     * Create a new BCC_157 report.
     * Validates for duplicates (same orgUnitId + reportYear + nguonDuLieu).
     */
    @Transactional
    public Bcc157Response create(Bcc157CreateRequest request) {
        log.info("Creating BCC_157 report for orgUnitId={}, year={}, nguonDuLieu={}",
                request.getOrgUnitId(), request.getReportYear(), request.getNguonDuLieu());

        if (request.getOrgUnitId() == null) {
            throw new IllegalArgumentException("orgUnitId must not be null");
        }
        if (request.getReportYear() == null) {
            throw new IllegalArgumentException("reportYear must not be null");
        }

        String nguonDuLieu = request.getNguonDuLieu() != null ? request.getNguonDuLieu() : "1";

        // Check for duplicates
        var existing = repository.findByOrgUnitIdAndReportYearAndNguonDuLieu(
                request.getOrgUnitId(), request.getReportYear(), nguonDuLieu);
        if (existing.isPresent()) {
            throw new IllegalStateException(
                    "Báo cáo đã tồn tại cho đơn vị, năm và nguồn dữ liệu này");
        }

        Bcc157Report entity = Bcc157Report.builder()
                .orgUnitId(request.getOrgUnitId())
                .reportYear(request.getReportYear())
                .nguonDuLieu(nguonDuLieu)
                .status("DRAFT")
                .maSoNguyenGiaSoDuDauNam(request.getMaSoNguyenGiaSoDuDauNam())
                .taiSanNguyenGiaSoDuDauNam(request.getTaiSanNguyenGiaSoDuDauNam())
                .maSoNguyenGiaTangTrongNam(request.getMaSoNguyenGiaTangTrongNam())
                .taiSanNguyenGiaTangTrongNam(request.getTaiSanNguyenGiaTangTrongNam())
                .maSoNguyenGiaGiamTrongNam(request.getMaSoNguyenGiaGiamTrongNam())
                .taiSanNguyenGiaGiamTrongNam(request.getTaiSanNguyenGiaGiamTrongNam())
                .maSoNguyenGiaSoDuCuoiNam(request.getMaSoNguyenGiaSoDuCuoiNam())
                .taiSanNguyenGiaSoDuCuoiNam(request.getTaiSanNguyenGiaSoDuCuoiNam())
                .maSoGiaTriHaoMonSoDuDauNam(request.getMaSoGiaTriHaoMonSoDuDauNam())
                .taiSanGiaTriHaoMonSoDuDauNam(request.getTaiSanGiaTriHaoMonSoDuDauNam())
                .maSoGiaTriHaoMonTangTrongNam(request.getMaSoGiaTriHaoMonTangTrongNam())
                .taiSanGiaTriHaoMonTangTrongNam(request.getTaiSanGiaTriHaoMonTangTrongNam())
                .maSoGiaTriHaoMonGiamTrongNam(request.getMaSoGiaTriHaoMonGiamTrongNam())
                .taiSanGiaTriHaoMonGiamTrongNam(request.getTaiSanGiaTriHaoMonGiamTrongNam())
                .maSoGiaTriHaoMonSoDuCuoiNam(request.getMaSoGiaTriHaoMonSoDuCuoiNam())
                .taiSanGiaTriHaoMonSoDuCuoiNam(request.getTaiSanGiaTriHaoMonSoDuCuoiNam())
                .maSoGiaTriConLaiTuNgayDauNam(request.getMaSoGiaTriConLaiTuNgayDauNam())
                .taiSanGiaTriConLaiTuNgayDauNam(request.getTaiSanGiaTriConLaiTuNgayDauNam())
                .maSoGiaTriConLaiTuNgayCuoiNam(request.getMaSoGiaTriConLaiTuNgayCuoiNam())
                .taiSanGiaTriConLaiTuNgayCuoiNam(request.getTaiSanGiaTriConLaiTuNgayCuoiNam())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        entity = repository.save(entity);
        log.info("Created BCC_157 report id={}", entity.getId());
        return toResponse(entity);
    }

    /**
     * Search reports with optional filters.
     */
    public List<Bcc157Response> search(Bcc157SearchRequest request) {
        log.info("Searching BCC_157 reports: orgUnitId={}, year={}, nguonDuLieu={}",
                request.getOrgUnitId(), request.getReportYear(), request.getNguonDuLieu());

        List<Bcc157Report> results;

        if (request.getOrgUnitId() != null && request.getReportYear() != null && request.getNguonDuLieu() != null) {
            var opt = repository.findByOrgUnitIdAndReportYearAndNguonDuLieu(
                    request.getOrgUnitId(), request.getReportYear(), request.getNguonDuLieu());
            results = opt.map(List::of).orElse(List.of());
        } else if (request.getOrgUnitId() != null && request.getReportYear() != null) {
            results = repository.findByOrgUnitIdAndReportYear(request.getOrgUnitId(), request.getReportYear());
        } else if (request.getReportYear() != null) {
            results = repository.findByReportYear(request.getReportYear());
        } else if (request.getOrgUnitId() != null) {
            results = repository.findByOrgUnitId(request.getOrgUnitId());
        } else if (request.getNguonDuLieu() != null) {
            results = repository.findByNguonDuLieu(request.getNguonDuLieu());
        } else {
            results = repository.findAll();
        }

        return results.stream().map(this::toResponse).toList();
    }

    /**
     * Get a report by its id.
     */
    public Bcc157Response getById(UUID id) {
        Bcc157Report entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("BCC_157 report not found: " + id));
        return toResponse(entity);
    }

    /**
     * Delete a report by its id.
     */
    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("BCC_157 report not found: " + id);
        }
        repository.deleteById(id);
        log.info("Deleted BCC_157 report id={}", id);
    }

    /**
     * Query by orgUnitId + year + nguonDuLieu for frontend integration.
     */
    public Bcc157Response findByOrgUnitIdAndReportYearAndNguonDuLieu(
            UUID orgUnitId, Integer reportYear, String nguonDuLieu) {
        return repository.findByOrgUnitIdAndReportYearAndNguonDuLieu(orgUnitId, reportYear, nguonDuLieu)
                .map(this::toResponse)
                .orElse(null);
    }

    private Bcc157Response toResponse(Bcc157Report entity) {
        return Bcc157Response.builder()
                .id(entity.getId())
                .orgUnitId(entity.getOrgUnitId())
                .reportYear(entity.getReportYear())
                .nguonDuLieu(entity.getNguonDuLieu())
                .status(entity.getStatus())
                .maSoNguyenGiaSoDuDauNam(entity.getMaSoNguyenGiaSoDuDauNam())
                .taiSanNguyenGiaSoDuDauNam(entity.getTaiSanNguyenGiaSoDuDauNam())
                .maSoNguyenGiaTangTrongNam(entity.getMaSoNguyenGiaTangTrongNam())
                .taiSanNguyenGiaTangTrongNam(entity.getTaiSanNguyenGiaTangTrongNam())
                .maSoNguyenGiaGiamTrongNam(entity.getMaSoNguyenGiaGiamTrongNam())
                .taiSanNguyenGiaGiamTrongNam(entity.getTaiSanNguyenGiaGiamTrongNam())
                .maSoNguyenGiaSoDuCuoiNam(entity.getMaSoNguyenGiaSoDuCuoiNam())
                .taiSanNguyenGiaSoDuCuoiNam(entity.getTaiSanNguyenGiaSoDuCuoiNam())
                .maSoGiaTriHaoMonSoDuDauNam(entity.getMaSoGiaTriHaoMonSoDuDauNam())
                .taiSanGiaTriHaoMonSoDuDauNam(entity.getTaiSanGiaTriHaoMonSoDuDauNam())
                .maSoGiaTriHaoMonTangTrongNam(entity.getMaSoGiaTriHaoMonTangTrongNam())
                .taiSanGiaTriHaoMonTangTrongNam(entity.getTaiSanGiaTriHaoMonTangTrongNam())
                .maSoGiaTriHaoMonGiamTrongNam(entity.getMaSoGiaTriHaoMonGiamTrongNam())
                .taiSanGiaTriHaoMonGiamTrongNam(entity.getTaiSanGiaTriHaoMonGiamTrongNam())
                .maSoGiaTriHaoMonSoDuCuoiNam(entity.getMaSoGiaTriHaoMonSoDuCuoiNam())
                .taiSanGiaTriHaoMonSoDuCuoiNam(entity.getTaiSanGiaTriHaoMonSoDuCuoiNam())
                .maSoGiaTriConLaiTuNgayDauNam(entity.getMaSoGiaTriConLaiTuNgayDauNam())
                .taiSanGiaTriConLaiTuNgayDauNam(entity.getTaiSanGiaTriConLaiTuNgayDauNam())
                .maSoGiaTriConLaiTuNgayCuoiNam(entity.getMaSoGiaTriConLaiTuNgayCuoiNam())
                .taiSanGiaTriConLaiTuNgayCuoiNam(entity.getTaiSanGiaTriConLaiTuNgayCuoiNam())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
