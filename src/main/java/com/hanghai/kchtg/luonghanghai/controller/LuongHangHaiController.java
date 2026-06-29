package com.hanghai.kchtg.luonghanghai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for F-038 -> F-043 Quan ly luong hang hai.
 */
@RestController
@RequestMapping("/api/v1/luong-hang-hai")
@RequiredArgsConstructor
public class LuongHangHaiController {

    private final LuongHangHaiService luongHangHaiService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:create')")
    public ResponseEntity<ApiResponse<LuongHangHaiResponse>> create(
            @RequestBody @Valid LuongHangHaiCreateRequest request) {
        LuongHangHaiResponse response = luongHangHaiService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tao luong hang hai thanh cong", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<LuongHangHaiResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(luongHangHaiService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<Page<LuongHangHaiResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<LuongHangHaiResponse> result = luongHangHaiService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:update')")
    public ResponseEntity<ApiResponse<LuongHangHaiResponse>> update(
            @PathVariable Long id,
            @RequestBody @Valid LuongHangHaiUpdateRequest request) {
        LuongHangHaiResponse response = luongHangHaiService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat luong hang hai thanh cong", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        luongHangHaiService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa luong hang hai thanh cong", null));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:approve:c1')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approveC1(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetRequest request) {
        PheDuyetResponse response = luongHangHaiService.approveC1(id, request);
        return ResponseEntity.ok(ApiResponse.success("Phe duyet cap 1 thanh cong", response));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:approve:c2')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approveC2(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetRequest request) {
        PheDuyetResponse response = luongHangHaiService.approveC2(id, request);
        return ResponseEntity.ok(ApiResponse.success("Phe duyet cap 2 thanh cong", response));
    }

    @GetMapping("/history/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:history')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(luongHangHaiService.getApprovalHistory(id)));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<KetQuaTimKiemResponse>> search(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "ngayGhiNhanStart", required = false) LocalDate ngayGhiNhanStart,
            @RequestParam(name = "ngayGhiNhanEnd", required = false) LocalDate ngayGhiNhanEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        KetQuaTimKiemResponse result = luongHangHaiService.searchDocuments(
                keyword, status, ngayGhiNhanStart, ngayGhiNhanEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<List<LuongHangHaiResponse>>> filterByStatus(
            @PathVariable String status) {
        LuongHangHaiApprovalStatus approvalStatus = LuongHangHaiApprovalStatus.valueOf(status);
        return ResponseEntity.ok(ApiResponse.success(luongHangHaiService.findByApprovalStatus(approvalStatus)));
    }
}
