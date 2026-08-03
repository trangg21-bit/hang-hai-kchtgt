package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.document.DocumentResponse;
import com.hanghai.kchtg.port.service.DocumentService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * REST controller for Document (Giấy tờ / tài liệu đính kèm).
 */
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Slf4j
@Validated
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload/{entityType}/{entityId}",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadFile(
            @PathVariable @NotBlank String entityType,
            @PathVariable @NotBlank String entityId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File upload không được để trống"));
        }

        String uploadedBy = authentication.getName();
        log.info("[DocumentController] Upload file: entityType={}, entityId={}, fileName={}, size={}, uploadedBy={}",
                entityType, entityId, file.getOriginalFilename(), file.getSize(), uploadedBy);

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";

        DocumentResponse response = documentService.uploadFile(
                entityType, entityId, file, originalFilename, contentType, file.getSize(), uploadedBy);

        return ResponseEntity.ok(ApiResponse.success("Đính kèm file thành công", response));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("@auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> listByEntity(
            @PathVariable @NotBlank String entityType,
            @PathVariable @NotBlank String entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageSize = Math.min(Math.max(size, 1), 100);
        log.info("[DocumentController] List attachments: entityType={}, entityId={}, page={}, size={}",
                entityType, entityId, page, pageSize);

        Page<DocumentResponse> result = documentService.listByEntity(entityType, entityId, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài liệu đính kèm thành công", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(@PathVariable UUID id) {
        log.info("[DocumentController] Get attachment by id={}", id);
        DocumentResponse response = documentService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài liệu đính kèm thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {

        String userId = authentication.getName();
        log.info("[DocumentController] Delete attachment: id={}, userId={}", id, userId);
        documentService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }
}
