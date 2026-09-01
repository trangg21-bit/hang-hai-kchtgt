package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.lrit.*;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.service.CoastalStationLRITService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stations/lrit")
@Validated
@RequiredArgsConstructor
@Tag(name = "LRIT Coastal Station", description = "Quản lý Đài thông tin nhận dạng và truy theo tầm xa (LRIT)")
@DataScope
public class CoastalStationLRITController {

    private final CoastalStationLRITService service;

    @GetMapping
    @Operation(summary = "Tìm kiếm phân trang danh sách Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<Page<CoastalStationLRITResponse>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID operatingOrgId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CoastalStationLRITResponse> results = service.searchPaged(
                orgUnitId, keyword, operatingOrgId, provinceId, conditionStatus, approvalStatus,
                updatedBy, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/counts")
    @Operation(summary = "Thống kê số lượng bản ghi theo tab trạng thái phê duyệt")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<Map<String, Long>> getCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus) {
        return ResponseEntity.ok(service.countByApprovalStatus(orgUnitId, keyword, conditionStatus));
    }

    @GetMapping("/options")
    @Operation(summary = "Lấy danh sách chọn nhanh các Đài LRIT đã duyệt")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<List<CoastalStationLRITResponse>> getOptions(@RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(service.findApprovedOptions(orgUnitId));
    }

    @GetMapping("/{id:[0-9a-fA-F-]{36}}")
    @Operation(summary = "Xem chi tiết Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<CoastalStationLRITResponse> getStationById(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.getStationById(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Đài LRIT (Lưu tạm hoặc Gửi duyệt)")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationLRITResponse> createStation(
            @RequestParam(defaultValue = "DRAFT") String action,
            @Valid @RequestBody CoastalStationLRITRequest request) {
        CoastalStationLRIT created = service.createStation(request);
        if ("SUBMIT".equalsIgnoreCase(action)) {
            created = service.submit(created.getId());
        }
        return ResponseEntity.ok(service.buildResponse(created));
    }

    @PostMapping("/create")
    @Operation(summary = "Create a new LRIT station (Legacy compatibility)")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationLRIT> createStationLegacy(@Valid @RequestBody CoastalStationLRITRequest request) {
        CoastalStationLRIT created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id:[0-9a-fA-F-]{36}}")
    @Operation(summary = "Cập nhật thông tin Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<?> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationLRITUpdateRequest request) {
        CoastalStationLRIT updated = service.updateStation(id, request);
        CoastalStationLRITResponse response = service.buildResponse(updated);
        return ResponseEntity.ok(response != null ? response : updated);
    }

    @DeleteMapping("/{id:[0-9a-fA-F-]{36}}")
    @Operation(summary = "Xóa mềm Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:delete', 'specialstation:delete', 'data:delete', 'admin:all')")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:create', 'coastalstationlrit:update', 'specialstation:create', 'specialstation:update', 'data:create', 'data:update', 'admin:all')")
    public ResponseEntity<CoastalStationLRITResponse> submit(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.submit(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/approve-c1")
    @Operation(summary = "Phê duyệt cấp 1 (Cảng vụ / Chi cục)")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:approvec1', 'coastalstationlrit:approve', 'specialstation:approve', 'data:approvec1', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationLRITResponse> approveLevel1(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.approveLevel1(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/approve-c2")
    @Operation(summary = "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam)")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:approvec2', 'coastalstationlrit:approve', 'specialstation:approve', 'data:approvec2', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationLRITResponse> approveLevel2(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.approveLevel2(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt hồ sơ")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:approvec1', 'coastalstationlrit:approvec2', 'coastalstationlrit:approve', 'specialstation:approve', 'data:approvec1', 'data:approvec2', 'data:approve', 'admin:all')")
    public ResponseEntity<?> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = null;
        if (body != null) {
            if (body.get("reason") != null) {
                reason = String.valueOf(body.get("reason"));
            } else if (body.get("rejectionReason") != null) {
                reason = String.valueOf(body.get("rejectionReason"));
            }
        }
        if (reason == null || reason.isBlank()) {
            reason = "Từ chối phê duyệt hồ sơ";
        }
        CoastalStationLRIT entity = service.rejectStation(id, reason, 1L);
        CoastalStationLRITResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response != null ? response : entity);
    }

    // Legacy adaptors for existing test cases
    @GetMapping("/list")
    @Operation(summary = "Get all active LRIT stations")
    public ResponseEntity<List<CoastalStationLRIT>> getAllStations() {
        return ResponseEntity.ok(service.getAllStations());
    }

    @GetMapping("/search")
    @Operation(summary = "Search LRIT stations by keyword")
    public ResponseEntity<List<CoastalStationLRIT>> searchStations(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchStations(keyword));
    }

    @GetMapping("/by-terminal/{terminalId}")
    @Operation(summary = "Find an LRIT station by terminal ID")
    public ResponseEntity<CoastalStationLRIT> findByTerminalId(@PathVariable String terminalId) {
        Optional<CoastalStationLRIT> station = service.findByTerminalId(terminalId);
        return station.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-imo/{imoNumber}")
    @Operation(summary = "Find an LRIT station by IMO number")
    public ResponseEntity<CoastalStationLRIT> findByImoNumber(@PathVariable String imoNumber) {
        Optional<CoastalStationLRIT> station = service.findByImoNumber(imoNumber);
        return station.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve an LRIT station (Legacy)")
    public ResponseEntity<CoastalStationLRIT> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationLRITApprovalRequest request) {
        CoastalStationLRIT approved = service.approveStation(id, request.getApproved(), 1L);
        return ResponseEntity.ok(approved);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for an LRIT station")
    public ResponseEntity<List<CoastalStationLRITHistoryResponse>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getHistory(id));
    }

    // ── Attachment endpoints (InfrastructureAttachment, ref_type LRIT_STATION) ──

    @PostMapping(value = "/{id}/attachments", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tài liệu đính kèm cho Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationLRITAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<org.springframework.web.multipart.MultipartFile> files) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        List<CoastalStationLRITAttachmentResponse> uploaded = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @GetMapping("/{id}/attachments")
    @Operation(summary = "Lấy danh sách tài liệu đính kèm của Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationLRITAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<CoastalStationLRITAttachmentResponse> list = service.listAttachments(id);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Danh sách tài liệu đính kèm", list));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @Operation(summary = "Xóa tài liệu đính kèm của Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @Operation(summary = "Tải xuống tài liệu đính kèm của Đài LRIT")
    @PreAuthorize("hasAnyAuthority('coastalstationlrit:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = service.getAttachment(id, attId);
        java.nio.file.Path path = java.nio.file.Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        try {
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            try {
                contentType = java.nio.file.Files.probeContentType(path);
                if (contentType == null) contentType = "application/octet-stream";
            } catch (Exception ignored) {}

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + (attachment.getFileName() != null ? attachment.getFileName().replace("\"", "") : "attachment") + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
