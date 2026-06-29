package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.TinhTrangDieuChinh;
import com.hanghai.kchtg.vanban.service.DieuChinhQuyHoachService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for F-134 Cập nhật quy hoạch bến cảng.
 */
@RestController
@RequestMapping("/api/v1/dieu-chinh-quy-hoach")
@RequiredArgsConstructor
public class DieuChinhQuyHoachController {

    private final DieuChinhQuyHoachService dieuChinhQuyHoachService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<DieuChinhQuyHoachResponse>>> listAdjustments() {
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.findAll()));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:dieu-chinh:create')")
    public ResponseEntity<ApiResponse<DieuChinhQuyHoachResponse>> createAdjustment(
            @RequestBody @Valid DieuChinhQuyHoachCreateRequest request) {
        DieuChinhQuyHoachResponse response = dieuChinhQuyHoachService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo điều chỉnh quy hoạch thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<DieuChinhQuyHoachResponse>> getAdjustment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:dieu-chinh:update')")
    public ResponseEntity<ApiResponse<DieuChinhQuyHoachResponse>> updateAdjustment(
            @PathVariable Long id,
            @RequestBody @Valid DieuChinhQuyHoachCreateRequest request) {
        DieuChinhQuyHoachResponse response = dieuChinhQuyHoachService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật điều chỉnh quy hoạch thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:dieu-chinh:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteAdjustment(@PathVariable Long id) {
        dieuChinhQuyHoachService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa điều chỉnh quy hoạch thành công", null));
    }

    @GetMapping("/quy-hoach/{quyHoachId}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<DieuChinhQuyHoachResponse>>> getByQuyHoachId(@PathVariable Long quyHoachId) {
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.findByQuyHoachId(quyHoachId)));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    @GetMapping("/status/{tinhTrang}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<DieuChinhQuyHoachResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangDieuChinh status = TinhTrangDieuChinh.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.findByTinhTrang(status)));
    }

    @PostMapping("/{id}/approval")
    @PreAuthorize("@auth.check(authentication, 'vanban:dieu-chinh:approve')")
    public ResponseEntity<ApiResponse<PheDuyetDieuChinhResponse>> addApproval(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetDieuChinhRequest request) {
        PheDuyetDieuChinhResponse response = dieuChinhQuyHoachService.addApproval(id, request);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt điều chỉnh thành công", response));
    }
}
