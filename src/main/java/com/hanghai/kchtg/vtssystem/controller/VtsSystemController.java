package com.hanghai.kchtg.vtssystem.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.vtssystem.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystemAttachment;
import com.hanghai.kchtg.vtssystem.service.VtsSystemService;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/vts-system", "/api/v1/he-thong-vts"})
public class VtsSystemController {

    private final VtsSystemService service;

    public VtsSystemController(VtsSystemService service) {
        this.service = service;
    }

    @PreAuthorize("@auth.check(authentication, 'vts:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<VtsSystemResponse>> create(
            @Valid @RequestBody VtsSystemCreateRequest request,
            Authentication authentication) {
        try {
            VtsSystemResponse response = service.create(request, SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<VtsSystemListResponse>> findAll(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        VtsSystemListResponse responses = service.findAllWithSearchAndCounts(orgUnitId, keyword, conditionStatus, approvalStatus, year, page, size);
        return ResponseEntity.ok(ApiResponse.success("Danh sách hệ thống VTS", responses));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> getById(
            @PathVariable UUID id,
            Authentication authentication) {
        VtsSystemResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody VtsSystemUpdateRequest request,
            Authentication authentication) {
        try {
            VtsSystemResponse response = service.update(id, request, SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {
        try {
            service.delete(id, SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approve:c1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> approveC1(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        try {
            VtsSystemResponse response = service.approveC1(id, request, SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approve:c2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> approveC2(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        try {
            VtsSystemResponse response = service.approveC2(id, request, SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * List records sitting at a given approval status. Mirrors the endpoint the other
     * infrastructure modules expose, which the frontend already calls.
     */
    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping("/approval-status/{status}")
    public ResponseEntity<ApiResponse<List<VtsSystemResponse>>> filterByApprovalStatus(
            @PathVariable ApprovalStatus status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(status)));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
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
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id) {
        List<HistoryEntry> entries = service.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", entries));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update')")
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VtsSystemAttachmentResponse>> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            VtsSystemAttachmentResponse response = service.uploadAttachment(id, file, SecurityUtils.getCurrentUserId());
            return ResponseEntity.ok(ApiResponse.success("Tải lên tài liệu đính kèm thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update')")
    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        try {
            service.deleteAttachment(id, attachmentId);
            return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        VtsSystemAttachment attachment = service.getAttachment(id, attachmentId);
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
    @GetMapping("/approval-status/counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> countByApprovalStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.countByApprovalStatus()));
    }
}
