package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.OperationConfirmation;
import com.hanghai.kchtg.document.entity.OperationPlan;
import com.hanghai.kchtg.document.entity.OperationPlanFile;
import com.hanghai.kchtg.document.entity.OperationPlanWork;
import com.hanghai.kchtg.document.entity.OperationReport;
import com.hanghai.kchtg.document.entity.OperationStatus;
import com.hanghai.kchtg.document.repository.OperationConfirmationRepository;
import com.hanghai.kchtg.document.repository.OperationDetailRepository;
import com.hanghai.kchtg.document.repository.OperationPlanRepository;
import com.hanghai.kchtg.document.repository.OperationReportRepository;
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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationPlanService {

    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OperationPlanRepository operationPlanRepository;
    private final OperationDetailRepository operationDetailRepository;
    private final OperationReportRepository operationReportRepository;
    private final OperationConfirmationRepository operationConfirmationRepository;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public OperationPlanResponse create(OperationPlanCreateRequest request) {
        log.info("Creating OperationPlan: {}", request.getPier());
        UUID orgUnitId = resolveOrgUnitId(request.getOrgUnitId());
        orgUnitScopeService.requireOrganizationInScope(orgUnitId);
        OperationStatus status = request.getStatus() != null ? request.getStatus() : OperationStatus.CHO_DOI_PHUY;
        String code = (request.getCode() != null && !request.getCode().isBlank())
                ? request.getCode() : generateOperationCode();

        OperationPlan operationPlan = OperationPlan.builder()
                .operationDate(request.getOperationDate())
                .pier(request.getPier())
                .equipment(request.getEquipment())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(status)
                .orgUnitId(orgUnitId)
                .operatingOrgUnitId(request.getOperatingOrgUnitId())
                .infrastructureType(request.getInfrastructureType())
                .code(code)
                .name(request.getName())
                .content(request.getContent())
                .expectedStartDate(request.getExpectedStartDate())
                .expectedEndDate(request.getExpectedEndDate())
                .note(request.getNote())
                .createdBy(request.getCreatedBy())
                .build();
        return toResponse(operationPlanRepository.save(operationPlan));
    }

    @Transactional(readOnly = true)
    public OperationPlanResponse getById(UUID id) {
        OperationPlan operationPlan = operationPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id));
        return toResponse(operationPlan);
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findAll() {
        return operationPlanRepository.findAll(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<OperationPlanResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return operationPlanRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public OperationPlanResponse update(UUID id, OperationPlanCreateRequest request) {
        OperationPlan operationPlan = operationPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id));

        if (request.getOperationDate() != null) operationPlan.setOperationDate(request.getOperationDate());
        if (request.getPier() != null) operationPlan.setPier(request.getPier());
        if (request.getEquipment() != null) operationPlan.setEquipment(request.getEquipment());
        if (request.getStartTime() != null) operationPlan.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) operationPlan.setEndTime(request.getEndTime());
        if (request.getStatus() != null) operationPlan.setStatus(request.getStatus());

        if (request.getOrgUnitId() != null) {
            orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
            operationPlan.setOrgUnitId(request.getOrgUnitId());
        }
        if (request.getOperatingOrgUnitId() != null) operationPlan.setOperatingOrgUnitId(request.getOperatingOrgUnitId());
        if (request.getInfrastructureType() != null) operationPlan.setInfrastructureType(request.getInfrastructureType());
        if (request.getCode() != null && !request.getCode().isBlank()) operationPlan.setCode(request.getCode());
        if (request.getName() != null) operationPlan.setName(request.getName());
        if (request.getContent() != null) operationPlan.setContent(request.getContent());
        if (request.getExpectedStartDate() != null) operationPlan.setExpectedStartDate(request.getExpectedStartDate());
        if (request.getExpectedEndDate() != null) operationPlan.setExpectedEndDate(request.getExpectedEndDate());
        if (request.getNote() != null) operationPlan.setNote(request.getNote());

        return toResponse(operationPlanRepository.save(operationPlan));
    }

    @Transactional
    public void delete(UUID id) {
        if (!operationPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id);
        }
        operationPlanRepository.deleteById(id);
        log.info("Deleted OperationPlan with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByOperationDate(LocalDate operationDate) {
        return operationPlanRepository.findByOperationDate(operationDate)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByStatus(OperationStatus status) {
        return operationPlanRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByPier(String pier) {
        return operationPlanRepository.findByPier(pier)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByEquipment(String equipment) {
        return operationPlanRepository.findByEquipment(equipment)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Check for scheduling conflicts (F-129).
     * Returns true if any conflicting schedule is found.
     */
    @Transactional(readOnly = true)
    public boolean hasConflictSchedule(LocalDate operationDate, LocalTime startTime,
                                        LocalTime endTime, String pier, String equipment) {
        List<OperationPlan> conflicts = operationPlanRepository.findConflictSchedule(
                operationDate, startTime, endTime, pier, equipment);
        return !conflicts.isEmpty();
    }

    @Transactional
    public OperationReportResponse createReport(OperationReportCreateRequest request) {
        log.info("Creating OperationReport: {}", request.getReportType());
        OperationReport bc = OperationReport.builder()
                .reportType(request.getReportType())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .totalCost(request.getTotalCost())
                .filePath(request.getFilePath())
                .createdBy(request.getCreatedBy())
                .build();
        return toOperationReportResponse(operationReportRepository.save(bc));
    }

    // ── Confirmation Recording ────────────────────────────────────────

    @Transactional
    public OperationConfirmationResponse recordConfirmation(UUID operationPlanId, OperationConfirmationCreateRequest request) {
        log.info("Recording OperationConfirmation for planId: {}", operationPlanId);
        OperationPlan operationPlan = operationPlanRepository.findById(operationPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + operationPlanId));

        if (operationPlan.getStatus() != OperationStatus.HOAN_THANH) {
            throw new IllegalStateException("Chỉ được ghi nhận xác nhận khi kế hoạch vận hành ở trạng thái Hoàn thành");
        }
        if (!operationConfirmationRepository.findByOperationPlanId(operationPlanId).isEmpty()) {
            throw new IllegalStateException("Kế hoạch vận hành đã có xác nhận");
        }

        OperationConfirmation confirmation = OperationConfirmation.builder()
                .operationPlanId(operationPlanId)
                .actualStartDate(request.getActualStartDate())
                .actualEndDate(request.getActualEndDate())
                .operatingTime(request.getOperatingTime())
                .operatingStatus(request.getOperatingStatus())
                .downtime(request.getDowntime())
                .incidentFrequency(request.getIncidentFrequency())
                .maxCapacity(request.getMaxCapacity())
                .actualCapacity(request.getActualCapacity())
                .resultContent(request.getResultContent())
                .resultNote(request.getResultNote())
                .recorder(request.getRecorder())
                .recordedDate(request.getRecordedDate())
                .build();

        return toConfirmationResponse(operationConfirmationRepository.save(confirmation));
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

    private String generateOperationCode() {
        String prefix = "OP-" + LocalDate.now().format(CODE_DATE) + "-";
        long count = operationPlanRepository.countByCodeStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private OperationPlanResponse toResponse(OperationPlan operationPlan) {
        List<OperationDetailResponse> chiTietList = new ArrayList<>();
        if (operationPlan.getOperationDetails() != null) {
            chiTietList = operationPlan.getOperationDetails().stream()
                    .map(vh -> OperationDetailResponse.builder()
                            .id(vh.getId())
                            .description(vh.getDescription())
                            .estimatedVolume(vh.getEstimatedVolume())
                            .actualVolume(vh.getActualVolume())
                            .notes(vh.getNotes())
                            .build())
                    .collect(Collectors.toList());
        }

        List<OperationPlanWorkResponse> workList = operationPlan.getWorkItems() == null
                ? new ArrayList<>()
                : operationPlan.getWorkItems().stream().map(this::toWorkResponse).collect(Collectors.toList());

        List<OperationPlanFileResponse> fileList = operationPlan.getFiles() == null
                ? new ArrayList<>()
                : operationPlan.getFiles().stream().map(this::toFileResponse).collect(Collectors.toList());

        List<OperationConfirmationResponse> confirmationList = operationPlan.getConfirmations() == null
                ? new ArrayList<>()
                : operationPlan.getConfirmations().stream().map(this::toConfirmationResponse).collect(Collectors.toList());

        return OperationPlanResponse.builder()
                .id(operationPlan.getId())
                .operationDate(operationPlan.getOperationDate())
                .pier(operationPlan.getPier())
                .equipment(operationPlan.getEquipment())
                .startTime(operationPlan.getStartTime())
                .endTime(operationPlan.getEndTime())
                .status(operationPlan.getStatus())
                .orgUnitId(operationPlan.getOrgUnitId())
                .orgUnitName(operationPlan.getOrgUnitId() != null ? orgUnitCacheService.getName(operationPlan.getOrgUnitId()) : null)
                .operatingOrgUnitId(operationPlan.getOperatingOrgUnitId())
                .infrastructureType(operationPlan.getInfrastructureType())
                .code(operationPlan.getCode())
                .name(operationPlan.getName())
                .content(operationPlan.getContent())
                .expectedStartDate(operationPlan.getExpectedStartDate())
                .expectedEndDate(operationPlan.getExpectedEndDate())
                .note(operationPlan.getNote())
                .createdBy(operationPlan.getCreatedBy())
                .createdDate(operationPlan.getCreatedDate())
                .updatedBy(operationPlan.getUpdatedBy())
                .updatedDate(operationPlan.getUpdatedDate())
                .operationDetails(chiTietList)
                .workItems(workList)
                .files(fileList)
                .confirmations(confirmationList)
                .build();
    }

    private OperationPlanWorkResponse toWorkResponse(OperationPlanWork w) {
        return OperationPlanWorkResponse.builder()
                .id(w.getId())
                .infrastructureId(w.getInfrastructureId())
                .infrastructureName(w.getInfrastructureName())
                .location(w.getLocation())
                .portName(w.getPortName())
                .build();
    }

    private OperationPlanFileResponse toFileResponse(OperationPlanFile f) {
        return OperationPlanFileResponse.builder()
                .id(f.getId())
                .fileCategory(f.getFileCategory())
                .fileType(f.getFileType())
                .fileName(f.getFileName())
                .filePath(f.getFilePath())
                .uploadedBy(f.getUploadedBy())
                .uploadedAt(f.getUploadedAt())
                .build();
    }

    private OperationConfirmationResponse toConfirmationResponse(OperationConfirmation c) {
        return OperationConfirmationResponse.builder()
                .id(c.getId())
                .operationPlanId(c.getOperationPlanId())
                .actualStartDate(c.getActualStartDate())
                .actualEndDate(c.getActualEndDate())
                .operatingTime(c.getOperatingTime())
                .operatingStatus(c.getOperatingStatus())
                .downtime(c.getDowntime())
                .incidentFrequency(c.getIncidentFrequency())
                .maxCapacity(c.getMaxCapacity())
                .actualCapacity(c.getActualCapacity())
                .resultContent(c.getResultContent())
                .resultNote(c.getResultNote())
                .recorder(c.getRecorder())
                .recordedDate(c.getRecordedDate())
                .build();
    }

    private OperationReportResponse toOperationReportResponse(OperationReport bc) {
        return OperationReportResponse.builder()
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
}
