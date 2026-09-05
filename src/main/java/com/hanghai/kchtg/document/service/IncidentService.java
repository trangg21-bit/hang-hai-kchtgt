package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.IncidentRecordRepository;
import com.hanghai.kchtg.document.repository.IncidentRepository;
import com.hanghai.kchtg.document.repository.ProcessingProgressRepository;
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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for Incident records (F-131). Legacy methods/flows preserved;
 * §3.1/§3.2 additions: orgUnit scope guard + fallback, SC-%06d code auto-gen,
 * new fields + children persistence, server-side UUID audit, soft delete.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final ProcessingProgressRepository processingProgressRepository;
    private final IncidentRecordRepository incidentRecordRepository;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public IncidentResponse create(IncidentCreateRequest request) {
        log.info("Creating Incident: {}", request.getLocation());
        UUID orgUnitId = resolveOrgUnitId(request.getOrgUnitId());
        LocalDateTime thoiGian = parseDiscoveryTime(request.getDiscoveryTime());
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String code = (request.getCode() == null || request.getCode().isBlank())
                ? generateCode(orgUnitId)
                : request.getCode().trim();

        Incident sc = Incident.builder()
                .orgUnitId(orgUnitId)
                .code(code)
                .discoveryTime(thoiGian)
                .occurredTo(request.getOccurredTo())
                .location(request.getLocation())
                .incidentType(request.getIncidentType())
                .infrastructureType(request.getInfrastructureType())
                .infrastructureId(request.getInfrastructureId())
                .infrastructureName(request.getInfrastructureName())
                .description(request.getDescription())
                .damageStatus(request.getDamageStatus())
                .severityLevel(request.getSeverityLevel())
                .processingStatus(request.getProcessingStatus() != null ? request.getProcessingStatus() : ProcessingStatus.TIEP_NHAN)
                .reporter(request.getReporter())
                .note(request.getNote())
                .createdBy(operatorId)
                .updatedBy(operatorId)
                .build();
        bindEvolutions(sc, request.getEvolutions());
        bindHandlings(sc, request.getHandlings());
        bindFiles(sc, request.getFiles());
        return toResponse(Objects.requireNonNull(incidentRepository.save(sc)));
    }

    @Transactional(readOnly = true)
    public IncidentResponse getById(UUID id) {
        return toResponse(findIncident(id));
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findAll() {
        return incidentRepository.findAll(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return incidentRepository.findAll(pageable).map(this::toResponse);
    }

    /**
     * Danh sách + bộ lọc (F-131 §7.1). All filters optional; when all null it
     * behaves like the paged findAll. Org scope is applied by the @DataScope
     * aspect (Hibernate orgUnitFilter), not by SQL here.
     */
    @Transactional(readOnly = true)
    public Page<IncidentResponse> findAllWithSearch(String keyword, ProcessingStatus status,
                                                    String incidentType, String damageStatus,
                                                    LocalDateTime occurredFrom, LocalDateTime occurredTo,
                                                    int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        String keywordLike = (keyword != null && !keyword.isBlank()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String typeLike = (incidentType != null && !incidentType.isBlank()) ? "%" + incidentType.trim().toLowerCase() + "%" : null;
        String damageLike = (damageStatus != null && !damageStatus.isBlank()) ? "%" + damageStatus.trim().toLowerCase() + "%" : null;
        return incidentRepository.findAllWithSearch(
                        keywordLike, status, typeLike, damageLike, occurredFrom, occurredTo, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public IncidentResponse update(UUID id, IncidentCreateRequest request) {
        Incident sc = findIncident(id);
        if (request.getOrgUnitId() != null && !request.getOrgUnitId().equals(sc.getOrgUnitId())) {
            orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
            sc.setOrgUnitId(request.getOrgUnitId());
        }
        if (request.getCode() != null && !request.getCode().isBlank()) sc.setCode(request.getCode().trim());
        if (request.getDiscoveryTime() != null && !request.getDiscoveryTime().isBlank()) {
            LocalDateTime parsed = parseDiscoveryTime(request.getDiscoveryTime());
            if (parsed != null) sc.setDiscoveryTime(parsed);
        }
        if (request.getOccurredTo() != null) sc.setOccurredTo(request.getOccurredTo());
        if (request.getLocation() != null) sc.setLocation(request.getLocation());
        if (request.getIncidentType() != null) sc.setIncidentType(request.getIncidentType());
        if (request.getInfrastructureType() != null) sc.setInfrastructureType(request.getInfrastructureType());
        if (request.getInfrastructureId() != null) sc.setInfrastructureId(request.getInfrastructureId());
        if (request.getInfrastructureName() != null) sc.setInfrastructureName(request.getInfrastructureName());
        if (request.getDescription() != null) sc.setDescription(request.getDescription());
        if (request.getDamageStatus() != null) sc.setDamageStatus(request.getDamageStatus());
        if (request.getSeverityLevel() != null) sc.setSeverityLevel(request.getSeverityLevel());
        if (request.getProcessingStatus() != null) sc.setProcessingStatus(request.getProcessingStatus());
        if (request.getReporter() != null) sc.setReporter(request.getReporter());
        if (request.getNote() != null) sc.setNote(request.getNote());
        sc.setUpdatedBy(SecurityUtils.getCurrentUserId());
        if (request.getEvolutions() != null) {
            sc.getEvolutions().clear();
            bindEvolutions(sc, request.getEvolutions());
        }
        if (request.getHandlings() != null) {
            sc.getHandlings().clear();
            bindHandlings(sc, request.getHandlings());
        }
        if (request.getFiles() != null) {
            sc.getFiles().clear();
            bindFiles(sc, request.getFiles());
        }
        return toResponse(Objects.requireNonNull(incidentRepository.save(sc)));
    }

    @Transactional
    public void delete(UUID id) {
        Incident sc = findIncident(id);
        sc.softDelete(SecurityUtils.getCurrentUserId());
        incidentRepository.save(sc);
        log.info("Soft-deleted Incident with id: {}", id);
    }

    // ── Search / Filter (legacy + new) ────────────────────────────────

    @Transactional(readOnly = true)
    public List<IncidentResponse> findByProcessingStatus(ProcessingStatus status) {
        return incidentRepository.findByProcessingStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findBySeverityLevel(SeverityLevel severity) {
        return incidentRepository.findBySeverityLevel(severity)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> searchByViTriContaining(String location, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return incidentRepository.findByLocationContainingIgnoreCase(location, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> searchByMoTaContaining(String description, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return incidentRepository.findByDescriptionContainingIgnoreCase(description, pageable).map(this::toResponse);
    }

    // ── Progress Updates (legacy flow preserved — D8: never delete rows) ──

    @Transactional
    public ProcessingProgressResponse addProgress(ProcessingProgressRequest request) {
        log.info("Adding ProcessingProgress for incidentId: {}", request.getIncidentId());
        Incident sc = findIncident(request.getIncidentId());
        ProcessingProgress td = ProcessingProgress.builder()
                .incident(sc)
                .updatedAt(request.getUpdatedAt() != null ? request.getUpdatedAt() : LocalDateTime.now())
                .progressDescription(request.getProgressDescription())
                .updatedBy(request.getUpdatedBy())
                .build();
        return toTienDoResponse(processingProgressRepository.save(td));
    }

    @Transactional(readOnly = true)
    public List<ProcessingProgressResponse> getProgressByIncident(UUID id) {
        return processingProgressRepository.findByIncidentId(id).stream()
                .map(this::toTienDoResponse).collect(Collectors.toList());
    }

    // ── IncidentRecord (legacy flow preserved) ────────────────────────

    @Transactional
    public IncidentRecordResponse createBienBan(IncidentRecordCreateRequest request) {
        log.info("Creating IncidentRecord for incidentId: {}", request.getIncidentId());
        IncidentRecord bb = IncidentRecord.builder()
                .incidentId(request.getIncidentId())
                .detailedDescription(request.getDetailedDescription())
                .remedialMeasures(request.getRemedialMeasures())
                .processingEndTime(request.getProcessingEndTime())
                .recorder(request.getRecorder())
                .attachedDocuments(request.getAttachedDocuments())
                .build();
        return toBienBanResponse(incidentRecordRepository.save(bb));
    }

    // ── Scope / code helpers ──────────────────────────────────────────

    /**
     * §6/BR-131-04: assign within scope, never NULL. Request org wins (guarded);
     * fallback to the caller's own unit scope when restricted; otherwise reject
     * with a Vietnamese message.
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

    /** Mã tự động SC-%06d theo từng đơn vị (D11; partial unique index backs it). */
    private String generateCode(UUID orgUnitId) {
        long next = incidentRepository.countByOrgUnitId(orgUnitId) + 1;
        return String.format("SC-%06d", next);
    }

    private LocalDateTime parseDiscoveryTime(String discoveryTime) {
        if (discoveryTime == null || discoveryTime.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(discoveryTime).atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (Exception e) {
            log.warn("Failed to parse discoveryTime: {}", discoveryTime);
            return null;
        }
    }

    private Incident findIncident(UUID id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));
    }

    private void bindEvolutions(Incident sc, List<IncidentEvolutionRequest> items) {
        if (items == null) return;
        for (IncidentEvolutionRequest r : items) {
            sc.getEvolutions().add(IncidentEvolution.builder()
                    .incident(sc)
                    .fromDate(r.getFromDate())
                    .toDate(r.getToDate())
                    .event(r.getEvent())
                    .build());
        }
    }

    private void bindHandlings(Incident sc, List<IncidentHandlingRequest> items) {
        if (items == null) return;
        for (IncidentHandlingRequest r : items) {
            sc.getHandlings().add(IncidentHandling.builder()
                    .incident(sc)
                    .handler(r.getHandler())
                    .directiveContent(r.getDirectiveContent())
                    .directiveDate(r.getDirectiveDate())
                    .measure(r.getMeasure())
                    .result(r.getResult())
                    .note(r.getNote())
                    .build());
        }
    }

    private void bindFiles(Incident sc, List<IncidentFileRequest> items) {
        if (items == null) return;
        UUID operatorId = SecurityUtils.getCurrentUserId();
        for (IncidentFileRequest r : items) {
            sc.getFiles().add(IncidentFile.builder()
                    .incident(sc)
                    .fileName(r.getFileName())
                    .filePath(r.getFilePath())
                    .fileType(r.getFileType())
                    .fileSize(r.getFileSize())
                    .fileCategory(r.getFileCategory() != null ? r.getFileCategory() : "INFO")
                    .uploadedAt(LocalDateTime.now())
                    .uploadedBy(operatorId)
                    .build());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private IncidentResponse toResponse(Incident sc) {
        List<ProcessingProgressResponse> progressList = new ArrayList<>();
        if (sc.getProcessingProgress() != null) {
            progressList = sc.getProcessingProgress().stream()
                    .map(t -> ProcessingProgressResponse.builder()
                            .id(t.getId())
                            .incidentId(t.getIncident().getId())
                            .updatedAt(t.getUpdatedAt())
                            .progressDescription(t.getProgressDescription())
                            .updatedBy(t.getUpdatedBy())
                            .build())
                    .collect(Collectors.toList());
        }
        List<IncidentEvolutionResponse> evolutions = sc.getEvolutions() == null ? List.of()
                : sc.getEvolutions().stream()
                .map(e -> IncidentEvolutionResponse.builder()
                        .id(e.getId()).fromDate(e.getFromDate()).toDate(e.getToDate()).event(e.getEvent())
                        .build())
                .collect(Collectors.toList());
        List<IncidentHandlingResponse> handlings = sc.getHandlings() == null ? List.of()
                : sc.getHandlings().stream()
                .map(h -> IncidentHandlingResponse.builder()
                        .id(h.getId()).handler(h.getHandler())
                        .directiveContent(h.getDirectiveContent()).directiveDate(h.getDirectiveDate())
                        .measure(h.getMeasure()).result(h.getResult()).note(h.getNote())
                        .build())
                .collect(Collectors.toList());
        List<IncidentFileResponse> files = sc.getFiles() == null ? List.of()
                : sc.getFiles().stream()
                .map(f -> IncidentFileResponse.builder()
                        .id(f.getId()).fileName(f.getFileName()).filePath(f.getFilePath())
                        .fileType(f.getFileType()).fileSize(f.getFileSize())
                        .fileCategory(f.getFileCategory())
                        .uploadedAt(f.getUploadedAt()).uploadedBy(f.getUploadedBy())
                        .build())
                .collect(Collectors.toList());

        return IncidentResponse.builder()
                .id(sc.getId())
                .code(sc.getCode())
                .orgUnitId(sc.getOrgUnitId())
                .orgUnitName(sc.getOrgUnitId() != null ? orgUnitCacheService.getName(sc.getOrgUnitId()) : null)
                .discoveryTime(sc.getDiscoveryTime())
                .occurredTo(sc.getOccurredTo())
                .location(sc.getLocation())
                .incidentType(sc.getIncidentType())
                .infrastructureType(sc.getInfrastructureType())
                .infrastructureId(sc.getInfrastructureId())
                .infrastructureName(sc.getInfrastructureName())
                .description(sc.getDescription())
                .damageStatus(sc.getDamageStatus())
                .severityLevel(sc.getSeverityLevel())
                .processingStatus(sc.getProcessingStatus())
                .reporter(sc.getReporter())
                .note(sc.getNote())
                .createdBy(sc.getCreatedBy())
                .createdAt(sc.getCreatedAt())
                .updatedBy(sc.getUpdatedBy())
                .updatedAt(sc.getUpdatedAt())
                .evolutions(evolutions)
                .handlings(handlings)
                .files(files)
                .processingProgress(progressList)
                .build();
    }

    private ProcessingProgressResponse toTienDoResponse(ProcessingProgress td) {
        return ProcessingProgressResponse.builder()
                .id(td.getId())
                .incidentId(td.getIncident().getId())
                .updatedAt(td.getUpdatedAt())
                .progressDescription(td.getProgressDescription())
                .updatedBy(td.getUpdatedBy())
                .build();
    }

    private IncidentRecordResponse toBienBanResponse(IncidentRecord bb) {
        return IncidentRecordResponse.builder()
                .id(bb.getId())
                .incidentId(bb.getIncidentId())
                .detailedDescription(bb.getDetailedDescription())
                .remedialMeasures(bb.getRemedialMeasures())
                .processingEndTime(bb.getProcessingEndTime())
                .recorder(bb.getRecorder())
                .recordedAt(bb.getRecordedAt())
                .attachedDocuments(bb.getAttachedDocuments())
                .build();
    }
}
