package com.hanghai.kchtg.vtssystem.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.service.VtsSystemService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/v1/vts-systems", "/api/v1/vts-system", "/api/v1/he-thong-vts" })
@DataScope
public class VtsSystemController {

    /** Trần số bản ghi mỗi trang cho endpoint danh sách. */
    private static final int MAX_PAGE_SIZE = 200;

    private final VtsSystemService service;

    public VtsSystemController(VtsSystemService service) {
        this.service = service;
    }

    @PreAuthorize("@auth.check(authentication, 'vts:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<VtsSystemResponse>> create(
            @Valid @RequestBody VtsSystemCreateRequest request,
            Authentication authentication) {
        VtsSystemResponse response = service.create(request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:create')")
    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã thành công", java.util.Map.of("code", code)));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping
    public ResponseEntity<ApiResponse<VtsSystemListResponse>> findAll(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String systemName,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate operationStartDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate operationStartDateTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "true") boolean includeCounts,
            @RequestParam(required = false) String sort) {
        // Chặn trần số bản ghi mỗi trang: `size` đến từ client, không giới hạn thì
        // một request `size=100000` kéo cả bảng ra khỏi CSDL.
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        VtsSystemListResponse responses = service.findAllWithSearchAndCounts(
                orgUnitId, portId, provinceId, keyword, systemName, code, conditionStatus, approvalStatus,
                operationStartDateFrom, operationStartDateTo, updatedFrom, updatedTo,
                year, page, safeSize, includeCounts, sort);
        return ResponseEntity.ok(ApiResponse.success("Danh sách hệ thống VTS", responses));
    }

    public ResponseEntity<ApiResponse<VtsSystemListResponse>> findAll(
            UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus,
            Integer year, int page, int size, boolean includeCounts, String sort) {
        return findAll(orgUnitId, null, null, keyword, null, null, conditionStatus, approvalStatus, null, null, null, null, year, page, size, includeCounts, sort);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<VtsSystemOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        List<VtsSystemOptionResponse> options = service.getOptions(orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách lựa chọn hệ thống VTS", options));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean includeZones,
            @RequestParam(defaultValue = "false") boolean includeAttachments,
            Authentication authentication) {
        VtsSystemResponse response = service.getById(id, includeZones, includeAttachments);
        return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/{id}/zones")
    public ResponseEntity<ApiResponse<?>> getZones(
            @PathVariable UUID id,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vùng VTS thành công", service.getZones(id, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vùng VTS thành công", service.getZones(id)));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vts:create', 'vts:update', 'vts:approvec2')")
    @DataScope
    @PostMapping("/{id}/zones")
    public ResponseEntity<ApiResponse<VtsZoneDto>> createZone(
            @PathVariable UUID id,
            @Valid @RequestBody VtsZoneDto dto,
            Authentication authentication) {
        VtsZoneDto response = service.createZone(id, dto, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Thêm mới vùng VTS thành công", response));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vts:update', 'vts:approvec2')")
    @DataScope
    @PutMapping("/{id}/zones/{zoneId}")
    public ResponseEntity<ApiResponse<VtsZoneDto>> updateZone(
            @PathVariable UUID id,
            @PathVariable UUID zoneId,
            @Valid @RequestBody VtsZoneDto dto,
            Authentication authentication) {
        VtsZoneDto response = service.updateZone(id, zoneId, dto, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vùng VTS thành công", response));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vts:update', 'vts:approvec2')")
    @DataScope
    @DeleteMapping("/{id}/zones/{zoneId}")
    public ResponseEntity<ApiResponse<Void>> deleteZone(
            @PathVariable UUID id,
            @PathVariable UUID zoneId,
            Authentication authentication) {
        service.deleteZone(id, zoneId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Xóa vùng VTS thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> getAttachments(@PathVariable UUID id) {
        return ResponseEntity
                .ok(ApiResponse.success("Lấy danh sách tài liệu đính kèm thành công", service.getAttachments(id)));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vts:update', 'vts:approvec2')")
    @DataScope
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody VtsSystemUpdateRequest request,
            Authentication authentication) {
        VtsSystemResponse response = service.update(id, request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:delete')")
    @DataScope
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {
        service.delete(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update')")
    @DataScope
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> submit(
            @PathVariable UUID id,
            Authentication authentication) {
        VtsSystemResponse response = service.submit(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approvec1')")
    @DataScope
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> approveC1(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        VtsSystemResponse response = service.approveC1(id, request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approvec2')")
    @DataScope
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> approveC2(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        VtsSystemResponse response = service.approveC2(id, request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", response));
    }

    /**
     * List records sitting at a given approval status. Mirrors the endpoint the
     * other
     * infrastructure modules expose, which the frontend already calls.
     */
    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/approval-status/{status}")
    public ResponseEntity<ApiResponse<List<VtsSystemResponse>>> filterByApprovalStatus(
            @PathVariable ApprovalStatus status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(status)));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<VtsSystemResponse>>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) Integer year) {
        List<VtsSystemResponse> responses = service.search(orgUnitId, keyword, conditionStatus, approvalStatus, year);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:history')")
    @DataScope
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime toDate) {
        List<HistoryEntry> entries = service.getHistory(id, page, pageSize, keyword, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", entries));
    }

    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(UUID id) {
        return getHistory(id, null, null, null, null, null);
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update') or @auth.check(authentication, 'vts:create') or @auth.check(authentication, 'vts:approvec2')")
    @DataScope
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VtsSystemAttachmentResponse>> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        VtsSystemAttachmentResponse response = service.uploadAttachment(id, file, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Tải lên tài liệu đính kèm thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update') or @auth.check(authentication, 'vts:create') or @auth.check(authentication, 'vts:approvec2')")
    @DataScope
    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        service.deleteAttachment(id, attachmentId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        InfrastructureAttachment attachment = service.getAttachment(id, attachmentId);
        Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(path);
        String contentType;
        try {
            contentType = Files.probeContentType(path);
        } catch (Exception ignored) {
            contentType = null;
        }
        MediaType mediaType = contentType == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + attachment.getFileName().replace("\"", "") + "\"")
                .body(resource);
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @DataScope
    @GetMapping("/approval-status/counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> countByApprovalStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.countByApprovalStatus()));
    }
}
