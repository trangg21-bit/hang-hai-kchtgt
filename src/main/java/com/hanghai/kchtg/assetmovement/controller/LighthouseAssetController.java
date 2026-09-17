package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.service.LighthouseAssetService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/asset/lighthouse-assets")
@DataScope
public class LighthouseAssetController {

    private final LighthouseAssetService service;

    public LighthouseAssetController(LighthouseAssetService service) {
        this.service = service;
    }

    private static final Set<String> SORTABLE_DB_FIELDS = InfraAssetController.SORTABLE_DB_FIELDS;

    private static Sort resolveSort(String sortBy, String sortDir) {
        String field = (sortBy != null && SORTABLE_DB_FIELDS.contains(sortBy.trim()))
                ? sortBy.trim()
                : "createdAt";
        return "ASC".equalsIgnoreCase(sortDir)
                ? Sort.by(field).ascending()
                : Sort.by(field).descending();
    }

    @PostMapping
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:create', 'lighthouse:create', 'lighthouse:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> create(
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = service.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản đèn biển đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:read', 'lighthouse:read', 'data:read')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> getById(
            @PathVariable UUID id) {
        InfraAssetResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:read', 'lighthouse:read', 'data:read')")
    public ResponseEntity<ApiResponse<Page<InfraAssetResponse>>> findAll(
            @RequestParam(required = false) String assetCode,
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) UUID parentOrgUnitId,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID usingOrgUnitId,
            @RequestParam(required = false) UUID lighthouseId,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) String assetCondition,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) LocalDate updatedFrom,
            @RequestParam(required = false) LocalDate updatedTo,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sortBy, sortDir));
        Page<InfraAssetResponse> result = service.findAll(
                assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                lighthouseId, types, assetCondition,
                approvalStatus, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:update', 'lighthouse:update', 'lighthouse:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đèn biển đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:delete', 'lighthouse:delete', 'lighthouse:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đèn biển đã được xóa", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:read', 'lighthouse:read', 'data:read')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        Object history = service.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử tài sản thành công", history));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:update', 'lighthouseasset:create', 'lighthouse:update')")
    public ResponseEntity<ApiResponse<List<InfraAssetAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<InfraAssetAttachmentResponse> result = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:read', 'lighthouse:read', 'data:read')")
    public ResponseEntity<ApiResponse<List<InfraAssetAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<InfraAssetAttachmentResponse> result = service.listAttachments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:update', 'lighthouse:update')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.checkAny(authentication, 'lighthouseasset:manage', 'lighthouseasset:read', 'lighthouse:read', 'data:read')")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        Attachment attachment = service.getAttachment(id, attId);
        Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(path);
        String contentType;
        try {
            contentType = Files.probeContentType(path);
        } catch (java.io.IOException ignored) {
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
}
