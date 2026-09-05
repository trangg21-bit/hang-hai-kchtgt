package com.hanghai.kchtg.document.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.document.dto.IncidentCreateRequest;
import com.hanghai.kchtg.document.dto.IncidentResponse;
import com.hanghai.kchtg.document.dto.ProcessingProgressRequest;
import com.hanghai.kchtg.document.dto.ProcessingProgressResponse;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.SeverityLevel;
import com.hanghai.kchtg.document.service.IncidentService;
import com.hanghai.kchtg.security.annotation.DataScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for F-131 Quản lý thông tin sự cố.
 * Class-level @DataScope activates the Hibernate orgUnitFilter for every
 * read (AGENTS data-scope convention: unit sees own subtree, Cục sees full).
 */
@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@DataScope
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<Page<IncidentResponse>>> listIncidents(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "processingStatus", required = false) ProcessingStatus processingStatus,
            @RequestParam(name = "incidentType", required = false) String incidentType,
            @RequestParam(name = "damageStatus", required = false) String damageStatus,
            @RequestParam(name = "occurredFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime occurredFrom,
            @RequestParam(name = "occurredTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime occurredTo,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<IncidentResponse> result = incidentService.findAllWithSearch(
                keyword, processingStatus, incidentType, damageStatus,
                occurredFrom, occurredTo, page, size);
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
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<IncidentResponse>> getIncident(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'incident:update')")
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
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<ProcessingProgressResponse>>> getProgress(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getProgressByIncident(id)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> filterByStatus(
            @PathVariable String status) {
        ProcessingStatus processingStatus = ProcessingStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(incidentService.findByProcessingStatus(processingStatus)));
    }

    @GetMapping("/severity/{severity}")
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> filterBySeverity(
            @PathVariable String severity) {
        SeverityLevel severityLevel = SeverityLevel.valueOf(severity);
        return ResponseEntity.ok(ApiResponse.success(incidentService.findBySeverityLevel(severityLevel)));
    }

    @GetMapping("/search/location")
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> searchByLocation(
            @RequestParam String location,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.searchByViTriContaining(location, page, size).getContent()));
    }

    @GetMapping("/search/description")
    @PreAuthorize("@auth.check(authentication, 'incident:read') or @auth.check(authentication, 'document:read')")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> searchByDescription(
            @RequestParam String description,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.searchByMoTaContaining(description, page, size).getContent()));
    }
}
