package com.hanghai.kchtg.navigationchannel.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for NavigationChannel (F-038 to F-043).
 * Class-level {@code @DataScope} activates orgUnitFilter + recordSecurityLevelFilter (data scope đọc).
 */
@RestController
@RequestMapping("/api/v1/navigation-channel")
@RequiredArgsConstructor
@DataScope
public class NavigationChannelController {

    private final NavigationChannelService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> create(
            @RequestBody @Valid NavigationChannelCreateRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Tạo luồng hàng hải thành công", service.create(req, userId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<NavigationChannelResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size).getContent()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:update')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid NavigationChannelUpdateRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity
                .ok(ApiResponse.success("Cập nhật luồng hàng hải thành công", service.update(id, req, userId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id, Authentication authentication) {
        UUID userId = currentUserId(authentication);
        service.softDelete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm luồng hàng hải thành công", null));
    }

    /** Gửi hồ sơ đi phê duyệt (mới — F-038). */
    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:update')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> submitApproval(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", service.submit(id, userId)));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC1(
            @PathVariable UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", service.approveC1(id, req, userId)));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC2(
            @PathVariable UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", service.approveC2(id, req, userId)));
    }

    /** Trả về cấp 1 (mới — F-038). */
    @PostMapping("/{id}/reject-level-1")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> rejectLevel1(
            @PathVariable UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Trả về cấp 1 thành công", service.rejectLevel1(id, req, userId)));
    }

    /** Trả về cấp 2 (mới — F-038). */
    @PostMapping("/{id}/reject-level-2")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> rejectLevel2(
            @PathVariable UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Trả về cấp 2 thành công", service.rejectLevel2(id, req, userId)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:history')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getApprovalHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getApprovalHistory(id)));
    }

    @GetMapping("/approval-status/{status}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<NavigationChannelResponse>>> filterByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(ApprovalStatus.valueOf(status))));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<SearchResultResponse>> search(
            @RequestParam(name = "orgUnitId", required = false) UUID orgUnitId,
            @RequestParam(name = "seaportId", required = false) UUID seaportId,
            @RequestParam(name = "provinceId", required = false) Integer provinceId,
            @RequestParam(name = "conditionStatus", required = false) ConditionStatus conditionStatus,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus,
                        keyword, approvalStatus, page, size)));
    }

    private UUID currentUserId(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
    }
}
