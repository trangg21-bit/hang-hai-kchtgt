# BE recovery reference — current bodies of the 6 legacy files (F-131/F-132-134)

Read from the PMO seat 2026-09-05. The BE wave reads THIS file for the current content, then rewrites the originals at their canonical paths with the design-plan §7.1/§7.2 new logic (write-side `requireOrganizationInScope`, `SC-%06d` code gen, `PortPlanning` DRAFT→EFFECTIVE→(REPLACED|HISTORY), controller `@DataScope`, new-field persistence, cargo auto-total).

## 1. src/main/java/com/hanghai/kchtg/document/service/IncidentService.java (231 lines)

```java
package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.IncidentRecordRepository;
import com.hanghai.kchtg.document.repository.IncidentRepository;
import com.hanghai.kchtg.document.repository.ProcessingProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final ProcessingProgressRepository processingProgressRepository;
    private final IncidentRecordRepository incidentRecordRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public IncidentResponse create(IncidentCreateRequest request) {
        log.info("Creating Incident: {}", request.getLocation());
        LocalDateTime thoiGian = null;
        if (request.getDiscoveryTime() != null && !request.getDiscoveryTime().isBlank()) {
            try {
                thoiGian = java.time.Instant.parse(request.getDiscoveryTime())
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime();
            } catch (Exception e) {
                log.warn("Failed to parse discoveryTime: {}", request.getDiscoveryTime());
            }
        }
        Incident sc = Incident.builder()
                .discoveryTime(thoiGian)
                .location(request.getLocation())
                .description(request.getDescription())
                .severityLevel(request.getSeverityLevel())
                .processingStatus(request.getProcessingStatus() != null ? request.getProcessingStatus() : ProcessingStatus.TIEP_NHAN)
                .reporter(request.getReporter())
                .build();
        return toResponse(Objects.requireNonNull(incidentRepository.save(sc)));
    }

    @Transactional(readOnly = true)
    public IncidentResponse getById(UUID id) {
        Incident sc = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));
        return toResponse(sc);
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

    @Transactional
    public IncidentResponse update(UUID id, IncidentCreateRequest request) {
        Incident sc = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));

        if (request.getDiscoveryTime() != null && !request.getDiscoveryTime().isBlank()) {
            try {
                sc.setDiscoveryTime(java.time.Instant.parse(request.getDiscoveryTime())
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime());
            } catch (Exception e) {
                log.warn("Failed to parse discoveryTime: {}", request.getDiscoveryTime());
            }
        }
        if (request.getLocation() != null) sc.setLocation(request.getLocation());
        if (request.getDescription() != null) sc.setDescription(request.getDescription());
        if (request.getSeverityLevel() != null) sc.setSeverityLevel(request.getSeverityLevel());
        if (request.getProcessingStatus() != null) sc.setProcessingStatus(request.getProcessingStatus());
        if (request.getReporter() != null) sc.setReporter(request.getReporter());

        return toResponse(Objects.requireNonNull(incidentRepository.save(sc)));
    }

    @Transactional
    public void delete(UUID id) {
        if (!incidentRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy sự cố với id: " + id);
        }
        incidentRepository.deleteById(id);
        log.info("Deleted Incident with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

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

    // ── Progress Updates ──────────────────────────────────────────────

    @Transactional
    public ProcessingProgressResponse addProgress(ProcessingProgressRequest request) {
        log.info("Adding ProcessingProgress for incidentId: {}", request.getIncidentId());
        Incident sc = incidentRepository.findById(request.getIncidentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + request.getIncidentId()));

        ProcessingProgress td = ProcessingProgress.builder()
                .incident(sc)
                .updatedAt(request.getUpdatedAt() != null ? request.getUpdatedAt() : LocalDateTime.now())
                .progressDescription(request.getProgressDescription())
                .updatedBy(request.getUpdatedBy())
                .build();

        return toTienDoResponse(processingProgressRepository.save(td));
    }

    @Transactional(readOnly = true)
    public List<ProcessingProgressResponse> getProgressByIncident(java.util.UUID id) {
        return processingProgressRepository.findByIncidentId(id).stream()
                .map(this::toTienDoResponse).collect(Collectors.toList());
    }

    // ── IncidentRecord ───────────────────────────────────────────────────

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
        return IncidentResponse.builder()
                .id(sc.getId())
                .discoveryTime(sc.getDiscoveryTime())
                .location(sc.getLocation())
                .severityLevel(sc.getSeverityLevel())
                .description(sc.getDescription())
                .processingStatus(sc.getProcessingStatus())
                .reporter(sc.getReporter())
                .createdAt(sc.getCreatedAt())
                .updatedBy(sc.getUpdatedBy())
                .updatedAt(sc.getUpdatedAt())
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
```

## 2. src/main/java/com/hanghai/kchtg/document/service/PortPlanningService.java (237 lines)

```java
package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.LookupLog;
import com.hanghai.kchtg.document.entity.PlanningFile;
import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.entity.PortPlanning;
import com.hanghai.kchtg.document.repository.LookupLogRepository;
import com.hanghai.kchtg.document.repository.PlanningCategoryRepository;
import com.hanghai.kchtg.document.repository.PlanningFileRepository;
import com.hanghai.kchtg.document.repository.PortPlanningRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class PortPlanningService {

    private final PortPlanningRepository portPlanningRepository;
    private final PlanningCategoryRepository planningCategoryRepository;
    private final PlanningFileRepository planningFileRepository;
    private final LookupLogRepository lookupLogRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public PortPlanningResponse create(PortPlanningCreateRequest request) {
        log.info("Creating PortPlanning: {}", request.getProjectName());

        if (request.getProjectName() != null && portPlanningRepository.existsByProjectName(request.getProjectName())) {
            throw new IllegalArgumentException("Tên đồ án quy hoạch bến cảng đã tồn tại: " + request.getProjectName());
        }

        PortPlanning planning = PortPlanning.builder()
                .projectName(request.getProjectName())
                .approvalAuthority(request.getApprovalAuthority())
                .approvalDate(request.getApprovalDate())
                .applicationScope(request.getApplicationScope())
                .mapScale(request.getMapScale())
                .status(request.getStatus())
                .filePath(request.getFilePath())
                .createdBy(request.getCreatedBy())
                .build();
        return toResponse(Objects.requireNonNull(portPlanningRepository.save(planning)));
    }

    @Transactional(readOnly = true)
    public PortPlanningResponse getById(UUID id) {
        PortPlanning planning = portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
        return toResponse(planning);
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
        PortPlanning planning = portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));

        if (request.getProjectName() != null) {
            if (portPlanningRepository.existsByProjectNameAndIdNot(request.getProjectName(), id)) {
                throw new IllegalArgumentException("Tên đồ án quy hoạch bến cảng đã tồn tại: " + request.getProjectName());
            }
            planning.setProjectName(request.getProjectName());
        }
        if (request.getApprovalAuthority() != null) planning.setApprovalAuthority(request.getApprovalAuthority());
        if (request.getApprovalDate() != null) planning.setApprovalDate(request.getApprovalDate());
        if (request.getApplicationScope() != null) planning.setApplicationScope(request.getApplicationScope());
        if (request.getMapScale() != null) planning.setMapScale(request.getMapScale());
        if (request.getStatus() != null) planning.setStatus(request.getStatus());
        if (request.getFilePath() != null) planning.setFilePath(request.getFilePath());
        if (request.getCreatedBy() != null) planning.setUpdatedBy(request.getCreatedBy());

        return toResponse(Objects.requireNonNull(portPlanningRepository.save(planning)));
    }

    @Transactional
    public void delete(UUID id) {
        if (!portPlanningRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id);
        }
        portPlanningRepository.deleteById(id);
        log.info("Deleted PortPlanning with id: {}", id);
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

    // ── Version Management ────────────────────────────────────────────

    @Transactional
    public PortPlanningResponse updateStatus(UUID id, PlanningStatus status) {
        PortPlanning planning = portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
        planning.setStatus(status);
        return toResponse(portPlanningRepository.save(planning));
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

    // ── Helpers ───────────────────────────────────────────────────────

    private PortPlanningResponse toResponse(PortPlanning planning) {
        List<PlanningCategoryResponse> hamMucList = new ArrayList<>();
        if (planning.getPlanningCategories() != null) {
            hamMucList = planning.getPlanningCategories().stream()
                    .map(hm -> PlanningCategoryResponse.builder()
                            .id(hm.getId())
                            .categoryName(hm.getCategoryName())
                            .unitOfMeasure(hm.getUnitOfMeasure())
                            .plannedValue(hm.getPlannedValue())
                            .actualValue(hm.getActualValue())
                            .status(hm.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }
        return PortPlanningResponse.builder()
                .id(planning.getId())
                .projectName(planning.getProjectName())
                .approvalAuthority(planning.getApprovalAuthority())
                .approvalDate(planning.getApprovalDate())
                .applicationScope(planning.getApplicationScope())
                .mapScale(planning.getMapScale())
                .status(planning.getStatus())
                .filePath(planning.getFilePath())
                .createdBy(planning.getCreatedBy())
                .createdAt(planning.getCreatedAt())
                .updatedBy(planning.getUpdatedBy())
                .updatedAt(planning.getUpdatedAt())
                .planningCategories(hamMucList)
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
```

## 3. src/main/java/com/hanghai/kchtg/document/controller/IncidentController.java (119 lines)

```java
package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.IncidentCreateRequest;
import com.hanghai.kchtg.document.dto.IncidentResponse;
import com.hanghai.kchtg.document.dto.ProcessingProgressRequest;
import com.hanghai.kchtg.document.dto.ProcessingProgressResponse;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.SeverityLevel;
import com.hanghai.kchtg.document.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<Page<IncidentResponse>>> listIncidents(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<IncidentResponse> result = incidentService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'incident:create')")
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @RequestBody @Valid IncidentCreateRequest request) {
        IncidentResponse response = incidentService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo sự cố thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<IncidentResponse>> getIncident(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getById(id)));
    }

    @PreAuthorize("@auth.check(authentication, 'incident:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> updateIncident(
            @PathVariable UUID id,
            @RequestBody @Valid IncidentCreateRequest request) {
        IncidentResponse response = incidentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sự cố thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'incident:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable UUID id) {
        incidentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sự cố thành công", null));
    }

    @PostMapping("/progress")
    @PreAuthorize("@auth.check(authentication, 'incident:progress')")
    public ResponseEntity<ApiResponse<ProcessingProgressResponse>> addProgress(
            @RequestBody @Valid ProcessingProgressRequest request) {
        ProcessingProgressResponse response = incidentService.addProgress(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiến độ thành công", response));
    }

    @GetMapping("/{id}/progress")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<ProcessingProgressResponse>>> getProgress(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getProgressByIncident(id)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> filterByStatus(
            @PathVariable String status) {
        ProcessingStatus processingStatus = ProcessingStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(incidentService.findByProcessingStatus(processingStatus)));
    }

    @GetMapping("/severity/{severity}")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> filterBySeverity(
            @PathVariable String severity) {
        SeverityLevel severityLevel = SeverityLevel.valueOf(severity);
        return ResponseEntity.ok(ApiResponse.success(incidentService.findBySeverityLevel(severityLevel)));
    }

    @GetMapping("/search/location")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> searchByLocation(
            @RequestParam String location,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.searchByViTriContaining(location, page, size).getContent()));
    }

    @GetMapping("/search/description")
    @PreAuthorize("@auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> searchByDescription(
            @RequestParam String description,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.searchByMoTaContaining(description, page, size).getContent()));
    }
}
```

## 4. src/main/java/com/hanghai/kchtg/document/controller/PortPlanningController.java (112 lines)

```java
package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.LookupResultResponse;
import com.hanghai.kchtg.document.dto.PortPlanningCreateRequest;
import com.hanghai.kchtg.document.dto.PortPlanningResponse;
import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.service.PortPlanningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/port-planning")
@RequiredArgsConstructor
public class PortPlanningController {

    private final PortPlanningService portPlanningService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<Page<PortPlanningResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<PortPlanningResponse> result = portPlanningService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'portplanning:create') or @auth.check(authentication, 'document:create')")
    public ResponseEntity<ApiResponse<PortPlanningResponse>> createPlan(
            @RequestBody @Valid PortPlanningCreateRequest request) {
        PortPlanningResponse response = portPlanningService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo quy hoạch bến cảng thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<PortPlanningResponse>> getPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(portPlanningService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:update') or @auth.check(authentication, 'document:update')")
    public ResponseEntity<ApiResponse<PortPlanningResponse>> updatePlan(
            @PathVariable UUID id,
            @RequestBody @Valid PortPlanningCreateRequest request) {
        PortPlanningResponse response = portPlanningService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quy hoạch bến cảng thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:delete') or @auth.check(authentication, 'document:delete')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable UUID id) {
        portPlanningService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa quy hoạch bến cảng thành công", null));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PortPlanningResponse>>> filterByStatus(
            @PathVariable String status) {
        PlanningStatus statusEnum = PlanningStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(portPlanningService.findByStatus(statusEnum)));
    }

    @GetMapping("/name-search")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PortPlanningResponse>>> searchByName(
            @RequestParam String keyword,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse
                .success(portPlanningService.searchByProjectNameContaining(keyword, page, size).getContent()));
    }

    @GetMapping("/date-range")
    @PreAuthorize("@auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<PortPlanningResponse>>> filterByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(portPlanningService.findByApprovalDateBetween(start, end)));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'portplanning:search') or @auth.check(authentication, 'portplanning:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<LookupResultResponse>> searchPlans(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "yearStart", required = false) LocalDate yearStart,
            @RequestParam(name = "yearEnd", required = false) LocalDate yearEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        LookupResultResponse result = portPlanningService.traCuu(
                keyword, status, yearStart, yearEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
```

## 5. src/main/java/com/hanghai/kchtg/document/repository/IncidentRepository.java (28 lines)

```java
package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.Incident;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.SeverityLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    List<Incident> findByProcessingStatus(ProcessingStatus processingStatus);

    List<Incident> findBySeverityLevel(SeverityLevel severityLevel);

    Page<Incident> findByLocationContainingIgnoreCase(String location, Pageable pageable);

    Page<Incident> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);
}
```

## 6. src/main/java/com/hanghai/kchtg/document/repository/PortPlanningRepository.java (50 lines)

```java
package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.entity.PortPlanning;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PortPlanningRepository extends JpaRepository<PortPlanning, UUID> {

  boolean existsByProjectName(String projectName);

  boolean existsByProjectNameAndIdNot(String projectName, UUID id);

  List<PortPlanning> findByStatus(PlanningStatus status);

  Page<PortPlanning> findByProjectNameContaining(String projectName, Pageable pageable);

  List<PortPlanning> findByApprovalDateBetween(LocalDate start, LocalDate end);

  @Query("SELECT q FROM PortPlanning q WHERE " +
    "(cast(:keyword as string) IS NULL OR LOWER(q.projectName) LIKE :keyword) AND " +
    "(:status IS NULL OR q.status = :status) AND " +
    "(cast(:yearStart as date) IS NULL OR q.approvalDate >= :yearStart) AND " +
    "(cast(:yearEnd as date) IS NULL OR q.approvalDate <= :yearEnd)")
  Page<PortPlanning> findAllWithSearch(
    @Param("keyword") String keyword,
    @Param("status") PlanningStatus status,
    @Param("yearStart") LocalDate yearStart,
    @Param("yearEnd") LocalDate yearEnd,
    Pageable pageable);
}
```
