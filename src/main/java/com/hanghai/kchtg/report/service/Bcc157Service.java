package com.hanghai.kchtg.report.service;

import java.util.Objects;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import java.util.ArrayList;
import java.math.BigDecimal;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.BeanUtils;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import jakarta.persistence.criteria.Predicate;
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
    private final BccReportScope reportScope;
    private final InfrastructureHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;
    private final OrgUnitCacheService orgUnits;

    /**
     * Create a new BCC_157 report.
     * Validates for duplicates (same orgUnitId + reportYear + nguonDuLieu).
     */
    @Transactional
    public Bcc157Response create(Bcc157CreateRequest request) {
        FieldWriteGuard.validateObject(request);
        reportScope.require(request.getOrgUnitId());
        normalize(request);
        log.info("Creating BCC_157 report for orgUnitId={}, year={}, nguonDuLieu={}",
                request.getOrgUnitId(), request.getReportYear(), request.getNguonDuLieu());

        if (request.getOrgUnitId() == null) {
            throw new IllegalArgumentException("Đơn vị báo cáo không được để trống");
        }
        if (request.getReportYear() == null) {
            throw new IllegalArgumentException("Năm báo cáo không được để trống");
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

        entity = repository.saveAndFlush(entity);
        recordHistory(entity, null, InfrastructureHistoryStatus.CREATED);
        log.info("Created BCC_157 report id={}", entity.getId());
        return toResponse(entity);
    }

    /**
     * Search reports with optional filters.
     */
    public List<Bcc157Response> search(Bcc157SearchRequest request) {
        log.info("Searching BCC_157 reports: orgUnitId={}, year={}, nguonDuLieu={}",
                request.getOrgUnitId(), request.getReportYear(), request.getNguonDuLieu());

        var units = reportScope.resolve(request.getOrgUnitId());
        List<Bcc157Report> results = repository.findAll((root, query, cb) -> {
            var filters = new ArrayList<Predicate>();
            if (units != null) filters.add(units.isEmpty() ? cb.disjunction()
                    : root.get(Bcc157Report.Fields.orgUnitId).in(units));
            if (request.getReportYear() != null) filters.add(cb.equal(
                    root.get(Bcc157Report.Fields.reportYear), request.getReportYear()));
            if (request.getNguonDuLieu() != null) filters.add(cb.equal(
                    root.get(Bcc157Report.Fields.nguonDuLieu), request.getNguonDuLieu()));
            return cb.and(filters.toArray(Predicate[]::new));
        });

        return results.stream().map(this::toResponse).toList();
    }

    /**
     * Get a report by its id.
     */
    public Bcc157Response getById(UUID id) {
        Bcc157Report entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo BCC157: " + id));
        reportScope.require(entity.getOrgUnitId());
        return toResponse(entity);
    }

    /**
     * Delete a report by its id.
     */
    @Transactional
    public void delete(UUID id) {
        Bcc157Report entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo BCC157: " + id));
        reportScope.require(entity.getOrgUnitId());
        recordHistory(entity, snapshot(entity), InfrastructureHistoryStatus.DELETED);
        repository.delete(entity);
        log.info("Deleted BCC_157 report id={}", id);
    }

    /**
     * Query by orgUnitId + year + nguonDuLieu for frontend integration.
     */
    public Bcc157Response findByOrgUnitIdAndReportYearAndNguonDuLieu(
            UUID orgUnitId, Integer reportYear, String nguonDuLieu) {
        reportScope.require(orgUnitId);
        return repository.findByOrgUnitIdAndReportYearAndNguonDuLieu(orgUnitId, reportYear, nguonDuLieu)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public Bcc157Response update(UUID id, Bcc157CreateRequest request) {
        Bcc157Report entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo BCC157: " + id));
        reportScope.require(entity.getOrgUnitId());
        FieldWriteGuard.validateObject(request);
        if (request.getVersion() == null || !request.getVersion().equals(entity.getVersion())) {
            throw new ObjectOptimisticLockingFailureException(Bcc157Report.class, id);
        }
        if (!entity.getOrgUnitId().equals(request.getOrgUnitId()) || !entity.getReportYear().equals(request.getReportYear())
                || !Objects.equals(entity.getNguonDuLieu(), request.getNguonDuLieu())) {
            throw new IllegalArgumentException("Không được đổi đơn vị, năm hoặc nguồn của báo cáo đã lưu");
        }
        FieldWriteGuard.validateUpdate(request, entity);
        normalize(request);
        String previous = snapshot(entity);
        BeanUtils.copyProperties(request, entity, Bcc157Report.Fields.version);
        entity.setUpdatedAt(LocalDateTime.now());
        entity = repository.saveAndFlush(entity);
        recordHistory(entity, previous, InfrastructureHistoryStatus.UPDATED);
        return toResponse(entity);
    }

    public List<InfrastructureHistory> history(UUID id) {
        getById(id); // validates scope before querying the unscoped shared history table
        return historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                InfrastructureType.REPORT_BCC157, id);
    }

    private void normalize(Bcc157CreateRequest request) {
        if (request.getReportYear() == null || request.getReportYear() < 1900 || request.getReportYear() > 9999) {
            throw new IllegalArgumentException("Năm báo cáo phải từ 1900 đến 9999");
        }
        if (request.getNguonDuLieu() == null) request.setNguonDuLieu("1");
        if (!List.of("1", "2").contains(request.getNguonDuLieu())) throw new IllegalArgumentException("Nguồn dữ liệu không hợp lệ");
        var bean = new BeanWrapperImpl(request);
        for (var field : bean.getPropertyDescriptors()) {
            String name = field.getName();
            if (name.endsWith("Code")) {
                Object value = bean.getPropertyValue(name);
                if (value instanceof String text) {
                    if (text.trim().length() > 20) throw new IllegalArgumentException("Mã số chỉ tiêu tối đa 20 ký tự");
                    bean.setPropertyValue(name, text.trim());
                }
            }
            if (name.startsWith("asset")) {
                Object value = bean.getPropertyValue(name);
                if (value instanceof BigDecimal amount && (amount.signum() < 0 || amount.scale() > 4
                        || amount.precision() - amount.scale() > 16)) {
                    throw new IllegalArgumentException("Số liệu phải không âm, tối đa 16 chữ số nguyên và 4 chữ số thập phân");
                }
            }
        }
        request.setAssetClosingOriginalCost(value(request.getAssetOpeningOriginalCost()).add(value(request.getAssetOriginalCostIncrease()))
                .subtract(value(request.getAssetOriginalCostDecrease())));
        request.setAssetClosingDepreciation(value(request.getAssetOpeningAccumulatedDepreciation()).add(value(request.getAssetDepreciationIncrease()))
                .subtract(value(request.getAssetDepreciationDecrease())));
        request.setAssetOpeningResidualValue(value(request.getAssetOpeningOriginalCost()).subtract(value(request.getAssetOpeningAccumulatedDepreciation())));
        request.setAssetClosingResidualValue(request.getAssetClosingOriginalCost().subtract(request.getAssetClosingDepreciation()));
        if (request.getAssetClosingOriginalCost().signum() < 0 || request.getAssetClosingDepreciation().signum() < 0
                || request.getAssetOpeningResidualValue().signum() < 0 || request.getAssetClosingResidualValue().signum() < 0) {
            throw new IllegalArgumentException("Số liệu không hợp lệ: số dư hoặc giá trị còn lại âm");
        }
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private String snapshot(Bcc157Report report) {
        try { return objectMapper.writeValueAsString(toResponse(report)); }
        catch (JsonProcessingException error) {
            throw new IllegalStateException("Không thể ghi lịch sử báo cáo", error);
        }
    }

    private void recordHistory(Bcc157Report entity, String previous,
            InfrastructureHistoryStatus status) {
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId()).refType(InfrastructureType.REPORT_BCC157)
                .status(status).approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now()).changedField("report")
                .previousValue(previous).newValue(status == InfrastructureHistoryStatus.DELETED ? null : snapshot(entity))
                .build());
    }

    private Bcc157Response toResponse(Bcc157Report entity) {
        return Bcc157Response.builder()
                .id(entity.getId())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnits.getName(entity.getOrgUnitId()))
                .reportYear(entity.getReportYear())
                .nguonDuLieu(entity.getNguonDuLieu())
                .status(entity.getStatus())
                .version(entity.getVersion())
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
