package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.giayto.GiayToResponse;
import com.hanghai.kchtg.cangben.service.GiayToService;
import jakarta.validation.Valid;
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
 * REST controller cho Giấy tờ / tài liệu đính kèm (GiayTo).
 * <p>
 * Cung cấp các endpoints để upload, liệt kê, lấy chi tiết và xóa file đính kèm
 * cho mọi entity loại trong module CangBen.
 * <p>
 * Endpoints:
 *   POST   /api/v1/giay-to/upload/{entityType}/{entityId} — upload file multipart
 *   GET    /api/v1/giay-to/entity/{entityType}/{entityId}  — liệt kê theo entity
 *   GET    /api/v1/giay-to/{id}                            — lấy theo id
 *   DELETE /api/v1/giay-to/{id}                            — xóa (MinIO + DB)
 * </p>
 *
 * Validates MIME type (PDF, DOCX, JPEG, JPG, PNG) và kích thước (max 10MB).
 * MinIO integration là stub — chỉ log key, không gọi API thật.
 *
 * Covers features F-008..F-037 shared (GiayTo).
 */
@RestController
@RequestMapping("/api/v1/giay-to")
@RequiredArgsConstructor
@Slf4j
@Validated
public class GiayToController {

    private final GiayToService giayToService;

    // ── UPLOAD FILE (multipart) ──────────────────────────────────────

    /**
     * Upload file đính kèm cho một entity.
     * <p>
     * entityType: cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc
     * Form field: file (multipart)
     * </p>
     *
     * @param entityType  loại entity (path variable)
     * @param entityId    ID của entity (path variable)
     * @param file        file upload (multipart/form-data)
     * @param uploadedBy  ID người upload
     * @return ApiResponse<GiayToResponse>
     */
    @PostMapping(value = "/upload/{entityType}/{entityId}",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<GiayToResponse>> uploadFile(
            @PathVariable @NotBlank String entityType,
            @PathVariable @NotBlank String entityId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        // Validate file is not empty
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File upload không được để trống"));
        }

        String uploadedBy = authentication.getName();
        log.info("[GiayToController] Upload file: entityType={}, entityId={}, fileName={}, size={}, uploadedBy={}",
                entityType, entityId, file.getOriginalFilename(), file.getSize(), uploadedBy);

        // Validate content type (MIME type)
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";

        GiayToResponse response = giayToService.uploadFile(
                entityType, entityId, file, originalFilename, contentType, file.getSize(), uploadedBy);

        return ResponseEntity.ok(ApiResponse.success("Đính kèm file thành công", response));
    }

    // ── LIST BY ENTITY ───────────────────────────────────────────────

    /**
     * Liệt kê tất cả tài liệu đính kèm cho một entity.
     * Phân trang: mặc định page=0, size=20, max=100.
     *
     * @param entityType loại entity (path variable)
     * @param entityId   ID của entity (path variable)
     * @param page       số trang (0-based), mặc định 0
     * @param size       kích thước trang, mặc định 20, max 100
     * @return ApiResponse<Page<GiayToResponse>>
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("@auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<Page<GiayToResponse>>> listByEntity(
            @PathVariable @NotBlank String entityType,
            @PathVariable @NotBlank String entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageSize = Math.min(Math.max(size, 1), 100);
        log.info("[GiayToController] List attachments: entityType={}, entityId={}, page={}, size={}",
                entityType, entityId, page, pageSize);

        Page<GiayToResponse> result = giayToService.listByEntity(entityType, entityId, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài liệu đính kèm thành công", result));
    }

    // ── GET BY ID ────────────────────────────────────────────────────

    /**
     * Lấy chi tiết một tài liệu đính kèm theo ID.
     *
     * @param id UUID của bản ghi GiayTo
     * @return ApiResponse<GiayToResponse>
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<GiayToResponse>> getById(@PathVariable UUID id) {
        log.info("[GiayToController] Get attachment by id={}", id);
        GiayToResponse response = giayToService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài liệu đính kèm thành công", response));
    }

    // ── DELETE ───────────────────────────────────────────────────────

    /**
     * Xóa tài liệu đính kèm (soft-delete DB + xóa MinIO stub).
     *
     * @param id     UUID của bản ghi GiayTo
     * @param userId ID người xóa
     * @return ApiResponse<Void>
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {

        String userId = authentication.getName();
        log.info("[GiayToController] Delete attachment: id={}, userId={}", id, userId);
        giayToService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }
}
