package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.cangcan.*;
import com.hanghai.kchtg.cangben.service.CangCanApprovalService;
import com.hanghai.kchtg.cangben.service.CangCanService;
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
 * REST controller for CangCan (inland port) CRUD + approval + history.
 * Covers features F-026 through F-031.
 * <p>
 * Endpoints:
 *   GET    /api/v1/cang-can          — list with pagination
 *   GET    /api/v1/cang-can/{id}      — get by id
 *   POST   /api/v1/cang-can          — create
 *   PUT    /api/v1/cang-can          — update
 *   DELETE /api/v1/cang-can/{id}      — soft-delete
 *   POST   /api/v1/cang-can/{id}/approve — approve
 *   POST   /api/v1/cang-can/{id}/reject  — reject
 *   GET    /api/v1/cang-can/{id}/history — history (change log)
 * </p>
 */
@RestController
@RequestMapping("/api/v1/cang-can")
@RequiredArgsConstructor
@Slf4j
@Validated
public class CangCanController {

    private final CangCanService cangCanService;
    private final CangCanApprovalService cangCanApprovalService;

    // ── CREATE (F-026) ───────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'cangcan:create')")
    public ResponseEntity<ApiResponse<CangCanResponse>> create(
            @Valid @RequestBody CreateCangCanRequest request) {
        log.info("Creating CangCan: code={}", request.getMaCangCan());
        CangCanResponse response = cangCanService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cảng cạn thành công", response));
    }

    // ── READ (F-029) ─────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangcan:read')")
    public ResponseEntity<ApiResponse<CangCanResponse>> getById(@PathVariable UUID id) {
        log.info("Getting CangCan by id={}", id);
        CangCanResponse response = cangCanService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng cạn thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'cangcan:read')")
    public ResponseEntity<ApiResponse<Page<CangCanResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId) {
        log.info("Listing CangCan: page={}, size={}, orgUnitId={}", page, size, orgUnitId);
        Page<CangCanResponse> result = cangCanService.findAll(page, size, orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng cạn thành công", result));
    }

    // ── UPDATE (F-027) ───────────────────────────────────────────────

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'cangcan:update')")
    public ResponseEntity<ApiResponse<CangCanResponse>> update(
            @Valid @RequestBody UpdateCangCanRequest request) {
        log.info("Updating CangCan: id={}", request.getId());
        CangCanResponse response = cangCanService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cảng cạn thành công", response));
    }

    // ── DELETE (F-028) ───────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangcan:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting CangCan: id={}", id);
        cangCanService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng cạn thành công", null));
    }

    // ── APPROVAL (F-030) ────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'cangcan:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving CangCan: id={}, userId={}", id, userId);
        cangCanApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cảng cạn thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'cangcan:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting CangCan: id={}, userId={}", id, userId);
        cangCanApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng cạn thành công", null));
    }

    // ── HISTORY (F-031) ────────────────────────────────────────────

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'cangcan:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting CangCan history: id={}", id);
        Object history = cangCanApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng cạn thành công", history));
    }
}
