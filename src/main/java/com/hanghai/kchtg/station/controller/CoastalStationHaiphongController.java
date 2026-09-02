package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.haiphong.*;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.service.CoastalStationHaiphongService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stations/haiphong")
@Validated
@RequiredArgsConstructor
@Tag(name = "Haiphong / Hanoi Maritime Station", description = "Quản lý Đài TTXLTT Hàng hải Hà Nội / Hải Phòng")
@DataScope
public class CoastalStationHaiphongController {

    private final CoastalStationHaiphongService service;

    @GetMapping
    @Operation(summary = "Tìm kiếm phân trang danh sách Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<Page<CoastalStationHaiphongResponse>> search(
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

        Page<CoastalStationHaiphongResponse> results = service.searchPaged(
                orgUnitId, keyword, operatingOrgId, provinceId, conditionStatus, approvalStatus,
                updatedBy, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/counts")
    @Operation(summary = "Thống kê số lượng bản ghi theo tab trạng thái phê duyệt")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<Map<String, Long>> getCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus) {
        return ResponseEntity.ok(service.countByApprovalStatus(orgUnitId, keyword, conditionStatus));
    }

    @GetMapping("/options")
    @Operation(summary = "Lấy danh sách chọn nhanh các Đài TTXLTT đã duyệt")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<List<CoastalStationHaiphongResponse>> getOptions(@RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(service.findApprovedOptions(orgUnitId));
    }

    @GetMapping("/generate-code")
    @Operation(summary = "Tự sinh mã Đài TTXLTT (TTXLTT-xxxx)")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<Map<String, String>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(Map.of("code", code));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<CoastalStationHaiphongResponse> getStationById(@PathVariable UUID id) {
        CoastalStationHaiphong entity = service.getStationById(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Đài TTXLTT (Lưu tạm hoặc Gửi duyệt)")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationHaiphongResponse> createStation(
            @RequestParam(defaultValue = "DRAFT") String action,
            @Valid @RequestBody CoastalStationHaiphongRequest request) {
        CoastalStationHaiphong created = service.createStation(request);
        if ("SUBMIT".equalsIgnoreCase(action)) {
            created = service.submit(created.getId());
        }
        return ResponseEntity.ok(service.buildResponse(created));
    }

    @PostMapping("/create")
    @Operation(summary = "Create a new Haiphong maritime station (Legacy compatibility)")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationHaiphong> createStationLegacy(@Valid @RequestBody CoastalStationHaiphongRequest request) {
        CoastalStationHaiphong created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<?> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationHaiphongUpdateRequest request) {
        CoastalStationHaiphong updated = service.updateStation(id, request);
        CoastalStationHaiphongResponse response = service.buildResponse(updated);
        return ResponseEntity.ok(response != null ? response : updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:delete', 'specialstation:delete', 'data:delete', 'admin:all')")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:create', 'coastalstationhaiphong:update', 'specialstation:create', 'specialstation:update', 'data:create', 'data:update', 'admin:all')")
    public ResponseEntity<CoastalStationHaiphongResponse> submit(@PathVariable UUID id) {
        CoastalStationHaiphong entity = service.submit(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id}/approve-c1")
    @Operation(summary = "Phê duyệt cấp 1 (Cảng vụ / Chi cục)")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:approvec1', 'coastalstationhaiphong:approve', 'specialstation:approve', 'data:approvec1', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationHaiphongResponse> approveLevel1(@PathVariable UUID id) {
        CoastalStationHaiphong entity = service.approveLevel1(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id}/approve-c2")
    @Operation(summary = "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam)")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:approvec2', 'coastalstationhaiphong:approve', 'specialstation:approve', 'data:approvec2', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationHaiphongResponse> approveLevel2(@PathVariable UUID id) {
        CoastalStationHaiphong entity = service.approveLevel2(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt hồ sơ")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:approvec1', 'coastalstationhaiphong:approvec2', 'coastalstationhaiphong:approve', 'specialstation:approve', 'data:approvec1', 'data:approvec2', 'data:approve', 'admin:all')")
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
        CoastalStationHaiphong entity = service.rejectStation(id, reason, 1L);
        CoastalStationHaiphongResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response != null ? response : entity);
    }

    // Legacy adaptors for existing test cases
    @GetMapping("/list")
    @Operation(summary = "Get all active Haiphong maritime stations")
    public ResponseEntity<List<CoastalStationHaiphong>> getAllStations() {
        return ResponseEntity.ok(service.getAllStations());
    }

    @GetMapping("/search")
    @Operation(summary = "Search Haiphong maritime stations by keyword")
    public ResponseEntity<List<CoastalStationHaiphong>> searchStations(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchStations(keyword));
    }

    @GetMapping("/by-port/{portName}")
    @Operation(summary = "Find Haiphong maritime stations by port name")
    public ResponseEntity<List<CoastalStationHaiphong>> findByPortName(@PathVariable String portName) {
        return ResponseEntity.ok(service.findByPortName(portName));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a Haiphong maritime station (Legacy)")
    public ResponseEntity<CoastalStationHaiphong> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationHaiphongApprovalRequest request) {
        CoastalStationHaiphong approved = service.approveStation(id, request.getApproved(), 1L);
        return ResponseEntity.ok(approved);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for a Haiphong maritime station")
    public ResponseEntity<List<CoastalStationHaiphongHistoryResponse>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getHistory(id));
    }

    // ── Attachment endpoints (InfrastructureAttachment, ref_type HANOI_STATION) ──

    @PostMapping(value = "/{id}/attachments", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tài liệu đính kèm cho Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationHaiphongAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<org.springframework.web.multipart.MultipartFile> files) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        List<CoastalStationHaiphongAttachmentResponse> uploaded = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @GetMapping("/{id}/attachments")
    @Operation(summary = "Lấy danh sách tài liệu đính kèm của Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationHaiphongAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<CoastalStationHaiphongAttachmentResponse> list = service.listAttachments(id);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Danh sách tài liệu đính kèm", list));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @Operation(summary = "Xóa tài liệu đính kèm của Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @Operation(summary = "Tải xuống tài liệu đính kèm của Đài TTXLTT")
    @PreAuthorize("hasAnyAuthority('coastalstationhaiphong:read', 'specialstation:read', 'data:read', 'admin:all')")
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


