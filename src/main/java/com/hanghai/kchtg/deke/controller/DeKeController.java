package com.hanghai.kchtg.deke.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.deke.dto.*;
import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import com.hanghai.kchtg.deke.service.DeKeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for DeKe (F-044 to F-049).
 */
@RestController
@RequestMapping("/api/v1/de-ke")
@RequiredArgsConstructor
public class DeKeController {

    private final DeKeService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'deke:create')")
    public ResponseEntity<ApiResponse<DeKeResponse>> create(
            @RequestBody @Valid DeKeCreateRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tao de ke thanh cong", service.create(req, authentication.getName())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'deke:read')")
    public ResponseEntity<ApiResponse<DeKeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'deke:read')")
    public ResponseEntity<ApiResponse<List<DeKeResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size).getContent()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'deke:update')")
    public ResponseEntity<ApiResponse<DeKeResponse>> update(
            @PathVariable Long id,
            @RequestBody @Valid DeKeUpdateRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Cap nhat de ke thanh cong", service.update(id, req, authentication.getName())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'deke:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id) {
        service.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa mem de ke thanh cong", null));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'deke:approvec1')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approveC1(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Phe duyet C1 thanh cong", service.approveC1(id, req)));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'deke:approvec2')")
    public ResponseEntity<ApiResponse<PheDuyetResponse>> approveC2(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Phe duyet C2 thanh cong", service.approveC2(id, req)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'deke:read')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getApprovalHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getApprovalHistory(id)));
    }

    @GetMapping("/status-phe-duyet/{trangThai}")
    @PreAuthorize("@auth.check(authentication, 'deke:read')")
    public ResponseEntity<ApiResponse<List<DeKeResponse>>> filterByStatus(@PathVariable String trangThai) {
        return ResponseEntity.ok(ApiResponse.success(service.findByTrangThaiPheDuyet(DeKeApprovalStatus.valueOf(trangThai))));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'deke:read')")
    public ResponseEntity<ApiResponse<KetQuaTimKiemResponse>> search(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "loaiDe", required = false) String loaiDe,
            @RequestParam(name = "tinhTrang", required = false) String tinhTrang,
            @RequestParam(name = "trangThaiPheDuyet", required = false) String trangThaiPheDuyet,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.searchDocuments(keyword, loaiDe, tinhTrang, trangThaiPheDuyet, page, size)));
    }
}
