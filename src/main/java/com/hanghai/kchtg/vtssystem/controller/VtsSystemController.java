package com.hanghai.kchtg.vtssystem.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.vtssystem.service.VtsSystemService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vts-system")
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
            VtsSystemResponse response = service.create(request, java.util.UUID.fromString(authentication.getName()));
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<VtsSystemResponse>>> findAll(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<VtsSystemResponse> responses = service.findAllWithSearch(orgUnitId, keyword, conditionStatus, approvalStatus, page, size);
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
            VtsSystemResponse response = service.update(id, request, java.util.UUID.fromString(authentication.getName()));
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
            service.delete(id, java.util.UUID.fromString(authentication.getName()));
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> approveC1(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        try {
            VtsSystemResponse response = service.approveC1(id, request, java.util.UUID.fromString(authentication.getName()));
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<VtsSystemResponse>> approveC2(
            @PathVariable UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        try {
            VtsSystemResponse response = service.approveC2(id, request, java.util.UUID.fromString(authentication.getName()));
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
            @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(status)));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<VtsSystemResponse>>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) String approvalStatus) {
        List<VtsSystemResponse> responses = service.search(orgUnitId, keyword, conditionStatus, approvalStatus);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id) {
        List<HistoryEntry> entries = service.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", entries));
    }
}

