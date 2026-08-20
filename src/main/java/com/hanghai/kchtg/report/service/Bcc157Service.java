package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
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
    // TODO(SECURITY): Enforce OrgUnitScope and RecordSecurityLevel before every
    // BCC_157
    // create/search/read query; repository access is currently unscoped.
    @Transactional
    public Bcc157Response create(Bcc157CreateRequest request) {
        FieldWriteGuard.validateObject(request);
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
                .openingOriginalCostCode(request.getOpeningOriginalCostCode())
                .assetOpeningOriginalCost(request.getAssetOpeningOriginalCost())
                .originalCostIncreaseCode(request.getOriginalCostIncreaseCode())
                .assetOriginalCostIncrease(request.getAssetOriginalCostIncrease())
                .originalCostDecreaseCode(request.getOriginalCostDecreaseCode())
                .assetOriginalCostDecrease(request.getAssetOriginalCostDecrease())
                .closingOriginalCostCode(request.getClosingOriginalCostCode())
                .assetClosingOriginalCost(request.getAssetClosingOriginalCost())
                .openingAccumulatedDepreciationCode(request.getOpeningAccumulatedDepreciationCode())
                .assetOpeningAccumulatedDepreciation(request.getAssetOpeningAccumulatedDepreciation())
                .depreciationIncreaseCode(request.getDepreciationIncreaseCode())
                .assetDepreciationIncrease(request.getAssetDepreciationIncrease())
                .depreciationDecreaseCode(request.getDepreciationDecreaseCode())
                .assetDepreciationDecrease(request.getAssetDepreciationDecrease())
                .closingDepreciationCode(request.getClosingDepreciationCode())
                .assetClosingDepreciation(request.getAssetClosingDepreciation())
                .openingResidualValueCode(request.getOpeningResidualValueCode())
                .assetOpeningResidualValue(request.getAssetOpeningResidualValue())
                .closingResidualValueCode(request.getClosingResidualValueCode())
                .assetClosingResidualValue(request.getAssetClosingResidualValue())
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
                .openingOriginalCostCode(entity.getOpeningOriginalCostCode())
                .assetOpeningOriginalCost(entity.getAssetOpeningOriginalCost())
                .originalCostIncreaseCode(entity.getOriginalCostIncreaseCode())
                .assetOriginalCostIncrease(entity.getAssetOriginalCostIncrease())
                .originalCostDecreaseCode(entity.getOriginalCostDecreaseCode())
                .assetOriginalCostDecrease(entity.getAssetOriginalCostDecrease())
                .closingOriginalCostCode(entity.getClosingOriginalCostCode())
                .assetClosingOriginalCost(entity.getAssetClosingOriginalCost())
                .openingAccumulatedDepreciationCode(entity.getOpeningAccumulatedDepreciationCode())
                .assetOpeningAccumulatedDepreciation(entity.getAssetOpeningAccumulatedDepreciation())
                .depreciationIncreaseCode(entity.getDepreciationIncreaseCode())
                .assetDepreciationIncrease(entity.getAssetDepreciationIncrease())
                .depreciationDecreaseCode(entity.getDepreciationDecreaseCode())
                .assetDepreciationDecrease(entity.getAssetDepreciationDecrease())
                .closingDepreciationCode(entity.getClosingDepreciationCode())
                .assetClosingDepreciation(entity.getAssetClosingDepreciation())
                .openingResidualValueCode(entity.getOpeningResidualValueCode())
                .assetOpeningResidualValue(entity.getAssetOpeningResidualValue())
                .closingResidualValueCode(entity.getClosingResidualValueCode())
                .assetClosingResidualValue(entity.getAssetClosingResidualValue())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
