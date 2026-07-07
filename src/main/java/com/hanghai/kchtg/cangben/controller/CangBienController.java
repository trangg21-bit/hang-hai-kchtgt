package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.cangbien.*;
import com.hanghai.kchtg.cangben.service.CangBienApprovalService;
import com.hanghai.kchtg.cangben.service.CangBienService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import java.util.UUID;

/**
 * REST controller for CangBien (port) CRUD + approval + history.
 * Covers features F-008 through F-013.
 * <p>
 * Endpoints:
 *   GET    /api/v1/cang-bien          — list with pagination
 *   GET    /api/v1/cang-bien/{id}      — get by id
 *   POST   /api/v1/cang-bien          — create
 *   PUT    /api/v1/cang-bien          — update
 *   DELETE /api/v1/cang-bien/{id}      — soft-delete
 *   POST   /api/v1/cang-bien/approve   — approve (batch)
 *   POST   /api/v1/cang-bien/reject    — reject (batch)
 *   GET    /api/v1/cang-bien/history   — history (change log)
 * </p>
 *
 * Authentication: @PreAuthorize per endpoint using cangbien:{action} pattern.
 * Note: Authorization is enforced by Spring Security configuration.
 * Controller methods call @auth.check(authentication, 'cangbien:action') via
 * the global method-security configuration.
 */
@RestController
@RequestMapping("/api/v1/cang-bien")
@RequiredArgsConstructor
@Slf4j
@Validated
public class CangBienController {

    private final CangBienService cangBienService;
    private final CangBienApprovalService cangBienApprovalService;

    // ── CREATE (F-008) ───────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'cangbien:create')")
    public ResponseEntity<ApiResponse<CangBienResponse>> create(
            @Valid @RequestBody CreateCangBienRequest request) {
        log.info("Creating CangBien: code={}", request.getMaCang());
        CangBienResponse response = cangBienService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cảng biển thành công", response));
    }

    // ── READ (F-012) ─────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangbien:read')")
    public ResponseEntity<ApiResponse<CangBienResponse>> getById(@PathVariable UUID id) {
        log.info("Getting CangBien by id={}", id);
        CangBienResponse response = cangBienService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng biển thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'cangbien:read')")
    public ResponseEntity<ApiResponse<Page<CangBienResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId) {
        log.info("Listing CangBien: page={}, size={}, orgUnitId={}", page, size, orgUnitId);
        Page<CangBienResponse> result = cangBienService.findAll(page, size, orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng biển thành công", result));
    }

    // ── UPDATE (F-009) ───────────────────────────────────────────────

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'cangbien:update')")
    public ResponseEntity<ApiResponse<CangBienResponse>> update(
            @Valid @RequestBody UpdateCangBienRequest request) {
        log.info("Updating CangBien: id={}", request.getId());
        CangBienResponse response = cangBienService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cảng biển thành công", response));
    }

    // ── DELETE (F-010) ───────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangbien:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting CangBien: id={}", id);
        cangBienService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng biển thành công", null));
    }

    // ── APPROVAL (F-011) ────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'cangbien:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving CangBien: id={}, userId={}", id, userId);
        cangBienApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cảng biển thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'cangbien:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting CangBien: id={}, userId={}", id, userId);
        cangBienApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng biển thành công", null));
    }

    // ── HISTORY (F-013) ────────────────────────────────────────────

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'cangbien:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting CangBien history: id={}", id);
        // Returns change history records (LichSuThayDoi)
        // Implementation in CangBienApprovalService
        Object history = cangBienApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng biển thành công", history));
    }
}
