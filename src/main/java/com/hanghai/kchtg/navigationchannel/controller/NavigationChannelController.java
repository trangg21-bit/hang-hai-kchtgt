package com.hanghai.kchtg.navigationchannel.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
import com.hanghai.kchtg.user.entity.User;
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
 */
@RestController
@RequestMapping("/api/v1/navigation-channel")
@RequiredArgsConstructor
public class NavigationChannelController {

    private final NavigationChannelService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> create(
            @RequestBody @Valid NavigationChannelCreateRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
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
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
        return ResponseEntity.ok(ApiResponse.success("Cập nhật luồng hàng hải thành công", service.update(id, req, userId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm luồng hàng hải thành công", null));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC1(
            @PathVariable UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt C1 thành công", service.approveC1(id, req, userId)));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC2(
            @PathVariable UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt C2 thành công", service.approveC2(id, req, userId)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
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
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "ApprovalStatus", required = false) String ApprovalStatus,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.searchDocuments(orgUnitId, keyword, ApprovalStatus, page, size)));
    }
}
