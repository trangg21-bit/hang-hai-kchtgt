package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiBienDong;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.service.YeuCauBienDongService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller cho Yeu Cau Bien Dong (F-127).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/yeu-cau-bien-dong")
@RequiredArgsConstructor
public class YeuCauBienDongController {

    private final YeuCauBienDongService yeuCauService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-bien-dong')")
    public ResponseEntity<ApiResponse<YeuCauBienDongResponse>> create(
            @RequestBody YeuCauBienDongRequest request) {
        YeuCauBienDongResponse response = yeuCauService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Yeu cau bien dong da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-bien-dong')")
    public ResponseEntity<ApiResponse<YeuCauBienDongResponse>> getById(
            @PathVariable UUID id) {
        YeuCauBienDongResponse response = yeuCauService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-bien-dong')")
    public ResponseEntity<ApiResponse<Page<YeuCauBienDongResponse>>> findAll(
            @RequestParam(required = false) LoaiBienDong loaiBienDong,
            @RequestParam(required = false) TrangThaiYeuCau trangThai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<YeuCauBienDongResponse> result;
        if (loaiBienDong != null && trangThai != null) {
            result = yeuCauService.findByLoaiBienDongAndTrangThai(loaiBienDong, trangThai, pageable);
        } else if (trangThai != null) {
            result = yeuCauService.findByTrangThai(trangThai, pageable);
        } else if (loaiBienDong != null) {
            result = yeuCauService.findByLoaiBienDong(loaiBienDong, pageable);
        } else {
            result = yeuCauService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-bien-dong')")
    public ResponseEntity<ApiResponse<YeuCauBienDongResponse>> update(
            @PathVariable UUID id,
            @RequestBody YeuCauBienDongRequest request) {
        YeuCauBienDongResponse response = yeuCauService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Yeu cau bien dong da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-bien-dong')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        yeuCauService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yeu cau bien dong da duoc xoa", null));
    }
}
