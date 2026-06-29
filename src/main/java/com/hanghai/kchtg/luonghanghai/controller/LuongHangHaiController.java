package com.hanghai.kchtg.luonghanghai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import jakarta.validation.*;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/luong-hang-hai") @RequiredArgsConstructor
public class LuongHangHaiController {
    private final LuongHangHaiService service;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<List<LuongHangHaiResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size).getContent()));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:create')")
    public ResponseEntity<ApiResponse<LuongHangHaiResponse>> create(@RequestBody @Valid LuongHangHaiCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Tao luong hang hai thanh cong", service.create(req)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<LuongHangHaiResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:update')")
    public ResponseEntity<ApiResponse<LuongHangHaiResponse>> update(
            @PathVariable Long id,
            @RequestBody @Valid LuongHangHaiUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Cap nhat luong hang hai thanh cong", service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa luong hang hai thanh cong", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:approve')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approve(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Phe duyet luong hang hai thanh cong", service.approve(id, req)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> history(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getHistory(id)));
    }

    @GetMapping("/status-phe-duyet/{trangThai}")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<List<LuongHangHaiResponse>>> filterByStatus(@PathVariable String trangThai) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(LuongHangHaiApprovalStatus.valueOf(trangThai))));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'luonghanghai:read')")
    public ResponseEntity<ApiResponse<KetQuaTimKiemResponse>> search(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "gioDien", required = false) String gioDien,
            @RequestParam(name = "taiTrong", required = false) String taiTrong,
            @RequestParam(name = "trangThaiPheDuyet", required = false) String trangThaiPheDuyet,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.searchDocuments(keyword, gioDien, taiTrong, trangThaiPheDuyet, page, size)));
    }
}
