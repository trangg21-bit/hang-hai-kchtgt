package com.hanghai.kchtg.dikerevetment.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.hanghai.kchtg.security.annotation.DataScope;

/**
 * REST controller for DikeRevetment (F-044 to F-049).
 */
@RestController
@RequestMapping("/api/v1/dike-revetment")
@RequiredArgsConstructor
@DataScope
public class DikeRevetmentController {

    private final DikeRevetmentService service;

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = service.generateDikeRevetmentCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã đê kè thành công", Map.of("code", code)));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:create')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> create(
            @RequestBody @Valid DikeRevetmentCreateRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        return ResponseEntity.ok(ApiResponse.success("Tạo đê kè thành công", service.create(req, userId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> getById(@PathVariable java.util.UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<List<DikeRevetmentResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size).getContent()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:update')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> update(
            @PathVariable java.util.UUID id,
            @RequestBody @Valid DikeRevetmentUpdateRequest req,
            Authentication authentication) {
        java.util.UUID userId2 = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đê kè thành công", service.update(id, req, userId2)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable java.util.UUID id) {
        service.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm đê kè thành công", null));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC1(
            @PathVariable java.util.UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt C1 thành công", service.approveC1(id, req, userId)));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec2')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC2(
            @PathVariable java.util.UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt C2 thành công", service.approveC2(id, req, userId)));
    }

    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:update')")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable java.util.UUID id,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        service.submitForApproval(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveL1(
            @PathVariable java.util.UUID id,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt thành công", service.approveL1(id, userId)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> reject(
            @PathVariable java.util.UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối", service.reject(id, req, userId)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getApprovalHistory(@PathVariable java.util.UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getApprovalHistory(id)));
    }

    @GetMapping("/approval-status/{status}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<List<DikeRevetmentResponse>>> filterByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(ApprovalStatus.valueOf(status))));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<SearchResultResponse>> search(
            @RequestParam(name = "orgUnitId", required = false) java.util.UUID orgUnitId,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "dikeRevetmentType", required = false) DikeRevetmentType dikeRevetmentType,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.searchDocuments(orgUnitId, keyword, dikeRevetmentType, status, approvalStatus, page, size)));
    }
}
