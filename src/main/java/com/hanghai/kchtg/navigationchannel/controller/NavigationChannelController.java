package com.hanghai.kchtg.navigationchannel.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelApprovalStatus;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Tạo luồng hàng hải thành công", service.create(req, username)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> getById(@PathVariable java.util.UUID id) {
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
            @PathVariable java.util.UUID id,
            @RequestBody @Valid NavigationChannelUpdateRequest req,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Cập nhật luồng hàng hải thành công", service.update(id, req, username)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable java.util.UUID id) {
        service.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm luồng hàng hải thành công", null));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approveC1(
            @PathVariable java.util.UUID id,
            @RequestBody @Valid PheDuyetRequest req,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt C1 thành công", service.approveC1(id, req, username)));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approveC2(
            @PathVariable java.util.UUID id,
            @RequestBody @Valid PheDuyetRequest req,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt C2 thành công", service.approveC2(id, req, username)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getApprovalHistory(@PathVariable java.util.UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getApprovalHistory(id)));
    }

    @GetMapping("/status-phe-duyet/{trangThai}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<NavigationChannelResponse>>> filterByStatus(@PathVariable String trangThai) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(NavigationChannelApprovalStatus.valueOf(trangThai))));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<KetQuaTimKiemResponse>> search(
            @RequestParam(name = "orgUnitId", required = false) java.util.UUID orgUnitId,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "trangThaiPheDuyet", required = false) String trangThaiPheDuyet,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.searchDocuments(orgUnitId, keyword, trangThaiPheDuyet, page, size)));
    }
}
