package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.MaintenancePlanRepository;
import com.hanghai.kchtg.document.repository.MaintenanceReportRepository;
import com.hanghai.kchtg.document.repository.MaintenanceResultRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenancePlanService {

    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final MaintenanceResultRepository maintenanceResultRepository;
    private final MaintenanceReportRepository maintenanceReportRepository;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public MaintenancePlanResponse create(MaintenancePlanCreateRequest request) {
        log.info("Creating MaintenancePlan: {}", request.getEquipment());
        UUID orgUnitId = resolveOrgUnitId(request.getOrgUnitId());
        orgUnitScopeService.requireOrganizationInScope(orgUnitId);
        MaintenanceStatus status = request.getStatus() != null ? request.getStatus() : MaintenanceStatus.CHO_DOI_PHUY;
        String code = (request.getCode() != null && !request.getCode().isBlank())
                ? request.getCode() : generateMaintenanceCode();

        MaintenancePlan maintenancePlan = MaintenancePlan.builder()
                .equipment(request.getEquipment())
                .maintenanceType(request.getMaintenanceType())
                .estimatedStartDate(request.getEstimatedStartDate())
                .estimatedEndDate(request.getEstimatedEndDate())
                .status(status)
                .estimatedCost(request.getEstimatedCost())
                .orgUnitId(orgUnitId)
                .operatingOrgUnitId(request.getOperatingOrgUnitId())
                .infrastructureType(request.getInfrastructureType())
                .code(code)
                .name(request.getName())
                .content(request.getContent())
                .note(request.getNote())
                .createdBy(request.getCreatedBy())
                .build();
        return toResponse(maintenancePlanRepository.save(maintenancePlan));
    }

    @Transactional(readOnly = true)
    public MaintenancePlanResponse getById(UUID id) {
        MaintenancePlan maintenancePlan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id));
        return toResponse(maintenancePlan);
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findAll() {
        return maintenancePlanRepository.findAll(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MaintenancePlanResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return maintenancePlanRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public MaintenancePlanResponse update(UUID id, MaintenancePlanCreateRequest request) {
        MaintenancePlan maintenancePlan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id));

        if (request.getEquipment() != null) maintenancePlan.setEquipment(request.getEquipment());
        if (request.getMaintenanceType() != null) maintenancePlan.setMaintenanceType(request.getMaintenanceType());
        if (request.getEstimatedStartDate() != null) maintenancePlan.setEstimatedStartDate(request.getEstimatedStartDate());
        if (request.getEstimatedEndDate() != null) maintenancePlan.setEstimatedEndDate(request.getEstimatedEndDate());
        if (request.getStatus() != null) maintenancePlan.setStatus(request.getStatus());
        if (request.getEstimatedCost() != null) maintenancePlan.setEstimatedCost(request.getEstimatedCost());

        if (request.getOrgUnitId() != null) {
            orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
            maintenancePlan.setOrgUnitId(request.getOrgUnitId());
        }
        if (request.getOperatingOrgUnitId() != null) maintenancePlan.setOperatingOrgUnitId(request.getOperatingOrgUnitId());
        if (request.getInfrastructureType() != null) maintenancePlan.setInfrastructureType(request.getInfrastructureType());
        if (request.getCode() != null && !request.getCode().isBlank()) maintenancePlan.setCode(request.getCode());
        if (request.getName() != null) maintenancePlan.setName(request.getName());
        if (request.getContent() != null) maintenancePlan.setContent(request.getContent());
        if (request.getNote() != null) maintenancePlan.setNote(request.getNote());

        return toResponse(maintenancePlanRepository.save(maintenancePlan));
    }

    @Transactional
    public void delete(UUID id) {
        if (!maintenancePlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id);
        }
        maintenancePlanRepository.deleteById(id);
        log.info("Deleted MaintenancePlan with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByEquipment(String equipment) {
        return maintenancePlanRepository.findByEquipment(equipment)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByStatus(MaintenanceStatus status) {
        return maintenancePlanRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByMaintenanceType(MaintenanceType maintenanceType) {
        return maintenancePlanRepository.findByMaintenanceType(maintenanceType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByNgayBatDauDuKienBetween(LocalDate start, LocalDate end) {
        return maintenancePlanRepository.findByEstimatedStartDateBetween(start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Result Recording ──────────────────────────────────────────────

    @Transactional
    public MaintenanceResultResponse recordResult(MaintenanceResultRequest request) {
        log.info("Recording MaintenanceResult for planId: {}", request.getMaintenancePlanId());
        MaintenancePlan maintenancePlan = maintenancePlanRepository.findById(request.getMaintenancePlanId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + request.getMaintenancePlanId()));

        MaintenanceResult kqb = MaintenanceResult.builder()
                .maintenancePlan(maintenancePlan)
                .actualStartDate(request.getActualStartDate())
                .actualEndDate(request.getActualEndDate())
                .resultDescription(request.getResultDescription())
                .resultNote(request.getResultNote())
                .replacedParts(request.getReplacedParts())
                .downtimeDuration(request.getDowntimeDuration())
                .recorder(request.getRecorder())
                .recordedDate(request.getRecordedDate())
                .build();

        return toResultResponse(maintenanceResultRepository.save(kqb));
    }

    // ── MaintenanceReport ──────────────────────────────────────────────────

    @Transactional
    public MaintenanceReportResponse createReport(MaintenanceReportCreateRequest request) {
        log.info("Creating MaintenanceReport: {}", request.getReportType());
        MaintenanceReport bc = MaintenanceReport.builder()
                .reportType(request.getReportType())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .totalCost(request.getTotalCost())
                .filePath(request.getFilePath())
                .createdBy(request.getCreatedBy())
                .build();
        return toMaintenanceReportResponse(maintenanceReportRepository.save(bc));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private UUID resolveOrgUnitId(UUID requestOrgUnitId) {
        if (requestOrgUnitId != null) {
            return requestOrgUnitId;
        }
        User user = SecurityUtils.getCurrentUser();
        if (user != null && user.getOrgUnit() != null) {
            return user.getOrgUnit().getId();
        }
        throw new IllegalArgumentException("Không xác định được đơn vị quản lý cho bản ghi");
    }

    private String generateMaintenanceCode() {
        String prefix = "MT-" + LocalDate.now().format(CODE_DATE) + "-";
        long count = maintenancePlanRepository.countByCodeStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private MaintenancePlanResponse toResponse(MaintenancePlan maintenancePlan) {
        List<MaintenancePlanWorkResponse> workList = maintenancePlan.getWorkItems() == null
                ? new ArrayList<>()
                : maintenancePlan.getWorkItems().stream().map(this::toWorkResponse).collect(Collectors.toList());

        List<MaintenancePlanFileResponse> fileList = maintenancePlan.getFiles() == null
                ? new ArrayList<>()
                : maintenancePlan.getFiles().stream().map(this::toFileResponse).collect(Collectors.toList());

        List<MaintenanceResultResponse> resultList = maintenancePlan.getResults() == null
                ? new ArrayList<>()
                : maintenancePlan.getResults().stream().map(this::toResultResponse).collect(Collectors.toList());

        return MaintenancePlanResponse.builder()
                .id(maintenancePlan.getId())
                .equipment(maintenancePlan.getEquipment())
                .maintenanceType(maintenancePlan.getMaintenanceType())
                .estimatedStartDate(maintenancePlan.getEstimatedStartDate())
                .estimatedEndDate(maintenancePlan.getEstimatedEndDate())
                .status(maintenancePlan.getStatus())
                .estimatedCost(maintenancePlan.getEstimatedCost())
                .orgUnitId(maintenancePlan.getOrgUnitId())
                .orgUnitName(maintenancePlan.getOrgUnitId() != null ? orgUnitCacheService.getName(maintenancePlan.getOrgUnitId()) : null)
                .operatingOrgUnitId(maintenancePlan.getOperatingOrgUnitId())
                .infrastructureType(maintenancePlan.getInfrastructureType())
                .code(maintenancePlan.getCode())
                .name(maintenancePlan.getName())
                .content(maintenancePlan.getContent())
                .note(maintenancePlan.getNote())
                .createdBy(maintenancePlan.getCreatedBy())
                .createdDate(maintenancePlan.getCreatedDate())
                .updatedBy(maintenancePlan.getUpdatedBy())
                .updatedDate(maintenancePlan.getUpdatedDate())
                .workItems(workList)
                .files(fileList)
                .results(resultList)
                .build();
    }

    private MaintenancePlanWorkResponse toWorkResponse(MaintenancePlanWork w) {
        return MaintenancePlanWorkResponse.builder()
                .id(w.getId())
                .infrastructureId(w.getInfrastructureId())
                .infrastructureName(w.getInfrastructureName())
                .portName(w.getPortName())
                .location(w.getLocation())
                .cost(w.getCost())
                .build();
    }

    private MaintenancePlanFileResponse toFileResponse(MaintenancePlanFile f) {
        return MaintenancePlanFileResponse.builder()
                .id(f.getId())
                .fileCategory(f.getFileCategory())
                .fileType(f.getFileType())
                .fileName(f.getFileName())
                .filePath(f.getFilePath())
                .uploadedBy(f.getUploadedBy())
                .uploadedAt(f.getUploadedAt())
                .build();
    }

    private MaintenanceReportResponse toMaintenanceReportResponse(MaintenanceReport bc) {
        return MaintenanceReportResponse.builder()
                .id(bc.getId())
                .reportType(bc.getReportType())
                .periodStart(bc.getPeriodStart())
                .periodEnd(bc.getPeriodEnd())
                .totalCost(bc.getTotalCost())
                .filePath(bc.getFilePath())
                .createdBy(bc.getCreatedBy())
                .createdAt(bc.getCreatedAt())
                .build();
    }

    private MaintenanceResultResponse toResultResponse(MaintenanceResult kqb) {
        return MaintenanceResultResponse.builder()
                .id(kqb.getId())
                .maintenancePlanId(kqb.getMaintenancePlan().getId())
                .actualStartDate(kqb.getActualStartDate())
                .actualEndDate(kqb.getActualEndDate())
                .resultDescription(kqb.getResultDescription())
                .resultNote(kqb.getResultNote())
                .replacedParts(kqb.getReplacedParts())
                .downtimeDuration(kqb.getDowntimeDuration())
                .recorder(kqb.getRecorder())
                .recordedDate(kqb.getRecordedDate())
                .build();
    }
}
