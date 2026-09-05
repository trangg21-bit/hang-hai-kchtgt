package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.LookupLogRepository;
import com.hanghai.kchtg.document.repository.PlanningCategoryRepository;
import com.hanghai.kchtg.document.repository.PlanningFileRepository;
import com.hanghai.kchtg.document.repository.PortPlanningRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for PortPlanning records (F-132/133/134). Legacy methods/flows
 * preserved; §4.1/§4.2 additions: orgUnit scope guard + fallback, group branch
 * fields, planToYear + planning textareas, DRAFT→EFFECTIVE→(REPLACED|HISTORY)
 * transitions (F-134), cargo-total auto-sum + min≤max (BR-132-02/03),
 * children persistence, server-side UUID audit, soft delete.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class PortPlanningService {

    private final PortPlanningRepository portPlanningRepository;
    private final PlanningCategoryRepository planningCategoryRepository;
    private final PlanningFileRepository planningFileRepository;
    private final LookupLogRepository lookupLogRepository;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public PortPlanningResponse create(PortPlanningCreateRequest request) {
        log.info("Creating PortPlanning: {}", request.getProjectName());

        if (request.getProjectName() != null && portPlanningRepository.existsByProjectName(request.getProjectName())) {
            throw new IllegalArgumentException("Tên đồ án quy hoạch bến cảng đã tồn tại: " + request.getProjectName());
        }

        UUID orgUnitId = resolveOrgUnitId(request.getOrgUnitId());
        UUID operatorId = SecurityUtils.getCurrentUserId();
        PlanningStatus status = request.getStatus() != null ? request.getStatus() : PlanningStatus.DRAFT;

        PortPlanning planning = PortPlanning.builder()
                .orgUnitId(orgUnitId)
                .projectName(request.getProjectName())
                .approvalAuthority(request.getApprovalAuthority())
                .approvalDate(request.getApprovalDate())
                .applicationScope(request.getApplicationScope())
                .mapScale(request.getMapScale())
                .status(status)
                .filePath(request.getFilePath())
                .decisionNumber(request.getDecisionNumber())
                .decisionDate(request.getDecisionDate())
                .planningGroup(request.getPlanningGroup())
                .seaportId(request.getSeaportId())
                .seaportGroup(request.getSeaportGroup())
                .dryPortId(request.getDryPortId())
                .planToYear(request.getPlanToYear())
                .planContent(request.getPlanContent())
                .landWaterDemand(request.getLandWaterDemand())
                .capitalDemand(request.getCapitalDemand())
                .implementationSolution(request.getImplementationSolution())
                .priorityProjects(request.getPriorityProjects())
                .implementationOrg(request.getImplementationOrg())
                .createdBy(operatorId)
                .updatedBy(operatorId)
                .build();
        bindPlanningCategories(planning, request.getPlanningCategories());
        bindCargoForecasts(planning, request.getCargoForecasts());
        return toResponse(Objects.requireNonNull(portPlanningRepository.save(planning)));
    }

    @Transactional(readOnly = true)
    public PortPlanningResponse getById(UUID id) {
        return toResponse(findPlanning(id));
    }

    @Transactional(readOnly = true)
    public List<PortPlanningResponse> findAll() {
        return portPlanningRepository.findAll(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PortPlanningResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return portPlanningRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public PortPlanningResponse update(UUID id, PortPlanningCreateRequest request) {
        PortPlanning planning = findPlanning(id);

        if (request.getProjectName() != null) {
            if (portPlanningRepository.existsByProjectNameAndIdNot(request.getProjectName(), id)) {
                throw new IllegalArgumentException("Tên đồ án quy hoạch bến cảng đã tồn tại: " + request.getProjectName());
            }
            planning.setProjectName(request.getProjectName());
        }
        if (request.getOrgUnitId() != null && !request.getOrgUnitId().equals(planning.getOrgUnitId())) {
            orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
            planning.setOrgUnitId(request.getOrgUnitId());
        }
        if (request.getApprovalAuthority() != null) planning.setApprovalAuthority(request.getApprovalAuthority());
        if (request.getApprovalDate() != null) planning.setApprovalDate(request.getApprovalDate());
        if (request.getApplicationScope() != null) planning.setApplicationScope(request.getApplicationScope());
        if (request.getMapScale() != null) planning.setMapScale(request.getMapScale());
        if (request.getFilePath() != null) planning.setFilePath(request.getFilePath());
        if (request.getDecisionNumber() != null) planning.setDecisionNumber(request.getDecisionNumber());
        if (request.getDecisionDate() != null) planning.setDecisionDate(request.getDecisionDate());
        if (request.getPlanningGroup() != null) planning.setPlanningGroup(request.getPlanningGroup());
        if (request.getSeaportId() != null) planning.setSeaportId(request.getSeaportId());
        if (request.getSeaportGroup() != null) planning.setSeaportGroup(request.getSeaportGroup());
        if (request.getDryPortId() != null) planning.setDryPortId(request.getDryPortId());
        if (request.getPlanToYear() != null) planning.setPlanToYear(request.getPlanToYear());
        if (request.getPlanContent() != null) planning.setPlanContent(request.getPlanContent());
        if (request.getLandWaterDemand() != null) planning.setLandWaterDemand(request.getLandWaterDemand());
        if (request.getCapitalDemand() != null) planning.setCapitalDemand(request.getCapitalDemand());
        if (request.getImplementationSolution() != null) planning.setImplementationSolution(request.getImplementationSolution());
        if (request.getPriorityProjects() != null) planning.setPriorityProjects(request.getPriorityProjects());
        if (request.getImplementationOrg() != null) planning.setImplementationOrg(request.getImplementationOrg());
        if (request.getStatus() != null && request.getStatus() != planning.getStatus()) {
            validateStatusTransition(planning.getStatus(), request.getStatus());
            planning.setStatus(request.getStatus());
        }
        planning.setUpdatedBy(SecurityUtils.getCurrentUserId());
        if (request.getPlanningCategories() != null) {
            planning.getPlanningCategories().clear();
            bindPlanningCategories(planning, request.getPlanningCategories());
        }
        if (request.getCargoForecasts() != null) {
            planning.getCargoForecasts().clear();
            bindCargoForecasts(planning, request.getCargoForecasts());
        }
        return toResponse(Objects.requireNonNull(portPlanningRepository.save(planning)));
    }

    @Transactional
    public void delete(UUID id) {
        PortPlanning planning = findPlanning(id);
        planning.softDelete(SecurityUtils.getCurrentUserId());
        portPlanningRepository.save(planning);
        log.info("Soft-deleted PortPlanning with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PortPlanningResponse> findByStatus(PlanningStatus status) {
        return portPlanningRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PortPlanningResponse> searchByProjectNameContaining(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return portPlanningRepository.findByProjectNameContaining(keyword, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PortPlanningResponse> findByApprovalDateBetween(LocalDate start, LocalDate end) {
        return portPlanningRepository.findByApprovalDateBetween(start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LookupResultResponse traCuu(String keyword, String status, LocalDate yearStart,
                                        LocalDate yearEnd, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        PlanningStatus statusEnum = (status != null && !status.isEmpty())
                ? PlanningStatus.valueOf(status) : null;
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        Page<PortPlanning> result = portPlanningRepository.findAllWithSearch(
                keywordLike, statusEnum, yearStart, yearEnd, pageable);
        return LookupResultResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    // ── Version Management (F-134 status transitions) ─────────────────

    @Transactional
    public PortPlanningResponse updateStatus(UUID id, PlanningStatus status) {
        PortPlanning planning = findPlanning(id);
        if (status != null && status != planning.getStatus()) {
            validateStatusTransition(planning.getStatus(), status);
            planning.setStatus(status);
        }
        return toResponse(portPlanningRepository.save(planning));
    }

    /**
     * UC-134 / §7.2: DRAFT → EFFECTIVE → (REPLACED | HISTORY); terminal states
     * are immutable; any other move is rejected with a Vietnamese message.
     */
    private void validateStatusTransition(PlanningStatus current, PlanningStatus next) {
        boolean allowed = switch (current) {
            case DRAFT -> next == PlanningStatus.DRAFT || next == PlanningStatus.EFFECTIVE;
            case EFFECTIVE -> next == PlanningStatus.EFFECTIVE
                    || next == PlanningStatus.REPLACED || next == PlanningStatus.HISTORY;
            default -> next == current;
        };
        if (!allowed) {
            throw new IllegalArgumentException("Không thể chuyển trạng thái quy hoạch từ "
                    + current.getLabel() + " sang " + next.getLabel());
        }
    }

    // ── File Management (F-132) ──────────────────────────────────────

    @Transactional
    public PlanningFileResponse uploadFile(PlanningFileCreateRequest request) {
        log.info("Uploading PlanningFile for planningId: {}", request.getPortPlanningId());
        PlanningFile fq = PlanningFile.builder()
                .portPlanningId(request.getPortPlanningId())
                .fileName(request.getFileName())
                .fileType(request.getFileType())
                .filePath(request.getFilePath())
                .fileSize(request.getFileSize())
                .uploadedBy(request.getUploadedBy())
                .build();
        return toPlanningFileResponse(planningFileRepository.save(fq));
    }

    // ── Search Logging (F-133) ───────────────────────────────────────

    @Transactional
    public void logTraCuu(LookupLog traCuuLog) {
        log.info("Logging LookupLog: {}", traCuuLog.getKeyword());
        lookupLogRepository.save(traCuuLog);
    }

    // ── Scope / children / cargo helpers ──────────────────────────────

    /**
     * §6/BR-132-01: assign within scope, never NULL. Request org wins
     * (guarded); fallback to the caller's own unit scope when restricted;
     * otherwise reject with a Vietnamese message.
     */
    private UUID resolveOrgUnitId(UUID requested) {
        if (requested != null) {
            orgUnitScopeService.requireOrganizationInScope(requested);
            return requested;
        }
        OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
        if (scope != null && !scope.unrestricted()
                && scope.orgUnitIds() != null && !scope.orgUnitIds().isEmpty()) {
            UUID fallback = scope.orgUnitIds().get(0);
            orgUnitScopeService.requireOrganizationInScope(fallback);
            return fallback;
        }
        throw new IllegalArgumentException(
                "Chưa xác định được Đơn vị quản lý — vui lòng chọn Đơn vị quản lý");
    }

    private PortPlanning findPlanning(UUID id) {
        return portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
    }

    private void bindPlanningCategories(PortPlanning planning, List<PlanningCategoryRequest> items) {
        if (items == null) return;
        for (PlanningCategoryRequest r : items) {
            planning.getPlanningCategories().add(PlanningCategory.builder()
                    .portPlanning(planning)
                    .phase(r.getPhase())
                    .categoryName(r.getCategoryName())
                    .unitOfMeasure(r.getUnitOfMeasure())
                    .plannedValue(r.getPlannedValue())
                    .actualValue(r.getActualValue())
                    .status(r.getStatus())
                    .portCategory(r.getPortCategory())
                    .portId(r.getPortId())
                    .portName(r.getPortName())
                    .exploitationFunction(r.getExploitationFunction())
                    .classification(r.getClassification())
                    .berthCount(r.getBerthCount())
                    .lengthM(r.getLengthM())
                    .shipSize(r.getShipSize())
                    .capacity(r.getCapacity())
                    .landArea(r.getLandArea())
                    .waterArea(r.getWaterArea())
                    .note(r.getNote())
                    .build());
        }
    }

    /**
     * Cargo forecast rows (F-132 rows 18-24): validate min ≤ max per band and
     * auto-compute the total band as the sum of the three bands (BR-132-02/03).
     */
    private void bindCargoForecasts(PortPlanning planning, List<PortPlanningCargoForecastRequest> items) {
        if (items == null) return;
        for (PortPlanningCargoForecastRequest r : items) {
            requireBandValid("Hàng container", r.getContainerMin(), r.getContainerMax());
            requireBandValid("Hàng tổng hợp/rời", r.getBulkMin(), r.getBulkMax());
            requireBandValid("Hàng lỏng/khí", r.getLiquidMin(), r.getLiquidMax());
            BigDecimal totalMin = sumBand(r.getContainerMin(), r.getBulkMin(), r.getLiquidMin());
            BigDecimal totalMax = sumBand(r.getContainerMax(), r.getBulkMax(), r.getLiquidMax());
            planning.getCargoForecasts().add(PortPlanningCargoForecast.builder()
                    .portPlanning(planning)
                    .classification(r.getClassification())
                    .portId(r.getPortId())
                    .portName(r.getPortName())
                    .containerMin(r.getContainerMin())
                    .containerMax(r.getContainerMax())
                    .bulkMin(r.getBulkMin())
                    .bulkMax(r.getBulkMax())
                    .liquidMin(r.getLiquidMin())
                    .liquidMax(r.getLiquidMax())
                    .totalMin(totalMin)
                    .totalMax(totalMax)
                    .note(r.getNote())
                    .build());
        }
    }

    private void requireBandValid(String bandName, BigDecimal min, BigDecimal max) {
        if (min != null && max != null && min.compareTo(max) > 0) {
            throw new IllegalArgumentException("Dự báo hàng hóa không hợp lệ: " + bandName
                    + " có giá trị tối thiểu lớn hơn tối đa");
        }
    }

    private BigDecimal sumBand(BigDecimal a, BigDecimal b, BigDecimal c) {
        BigDecimal sum = BigDecimal.ZERO;
        if (a != null) sum = sum.add(a);
        if (b != null) sum = sum.add(b);
        if (c != null) sum = sum.add(c);
        return sum;
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private PortPlanningResponse toResponse(PortPlanning planning) {
        List<PlanningCategoryResponse> hamMucList = new ArrayList<>();
        if (planning.getPlanningCategories() != null) {
            hamMucList = planning.getPlanningCategories().stream()
                    .map(hm -> PlanningCategoryResponse.builder()
                            .id(hm.getId())
                            .phase(hm.getPhase())
                            .categoryName(hm.getCategoryName())
                            .unitOfMeasure(hm.getUnitOfMeasure())
                            .plannedValue(hm.getPlannedValue())
                            .actualValue(hm.getActualValue())
                            .status(hm.getStatus())
                            .portCategory(hm.getPortCategory())
                            .portId(hm.getPortId())
                            .portName(hm.getPortName())
                            .exploitationFunction(hm.getExploitationFunction())
                            .classification(hm.getClassification())
                            .berthCount(hm.getBerthCount())
                            .lengthM(hm.getLengthM())
                            .shipSize(hm.getShipSize())
                            .capacity(hm.getCapacity())
                            .landArea(hm.getLandArea())
                            .waterArea(hm.getWaterArea())
                            .note(hm.getNote())
                            .build())
                    .collect(Collectors.toList());
        }
        List<PortPlanningCargoForecastResponse> cargoList = new ArrayList<>();
        if (planning.getCargoForecasts() != null) {
            cargoList = planning.getCargoForecasts().stream()
                    .map(cf -> PortPlanningCargoForecastResponse.builder()
                            .id(cf.getId())
                            .classification(cf.getClassification())
                            .portId(cf.getPortId())
                            .portName(cf.getPortName())
                            .containerMin(cf.getContainerMin())
                            .containerMax(cf.getContainerMax())
                            .bulkMin(cf.getBulkMin())
                            .bulkMax(cf.getBulkMax())
                            .liquidMin(cf.getLiquidMin())
                            .liquidMax(cf.getLiquidMax())
                            .totalMin(cf.getTotalMin())
                            .totalMax(cf.getTotalMax())
                            .note(cf.getNote())
                            .build())
                    .collect(Collectors.toList());
        }
        return PortPlanningResponse.builder()
                .id(planning.getId())
                .orgUnitId(planning.getOrgUnitId())
                .orgUnitName(planning.getOrgUnitId() != null ? orgUnitCacheService.getName(planning.getOrgUnitId()) : null)
                .projectName(planning.getProjectName())
                .approvalAuthority(planning.getApprovalAuthority())
                .approvalDate(planning.getApprovalDate())
                .applicationScope(planning.getApplicationScope())
                .mapScale(planning.getMapScale())
                .status(planning.getStatus())
                .filePath(planning.getFilePath())
                .decisionNumber(planning.getDecisionNumber())
                .decisionDate(planning.getDecisionDate())
                .planningGroup(planning.getPlanningGroup())
                .seaportId(planning.getSeaportId())
                .seaportGroup(planning.getSeaportGroup())
                .dryPortId(planning.getDryPortId())
                .planToYear(planning.getPlanToYear())
                .planContent(planning.getPlanContent())
                .landWaterDemand(planning.getLandWaterDemand())
                .capitalDemand(planning.getCapitalDemand())
                .implementationSolution(planning.getImplementationSolution())
                .priorityProjects(planning.getPriorityProjects())
                .implementationOrg(planning.getImplementationOrg())
                .createdBy(planning.getCreatedBy())
                .createdAt(planning.getCreatedAt())
                .updatedBy(planning.getUpdatedBy())
                .updatedAt(planning.getUpdatedAt())
                .planningCategories(hamMucList)
                .cargoForecasts(cargoList)
                .build();
    }

    private PlanningFileResponse toPlanningFileResponse(PlanningFile fq) {
        return PlanningFileResponse.builder()
                .id(fq.getId())
                .portPlanningId(fq.getPortPlanningId())
                .fileName(fq.getFileName())
                .fileType(fq.getFileType())
                .filePath(fq.getFilePath())
                .fileSize(fq.getFileSize())
                .uploadedAt(fq.getUploadedAt())
                .uploadedBy(fq.getUploadedBy())
                .build();
    }
}
