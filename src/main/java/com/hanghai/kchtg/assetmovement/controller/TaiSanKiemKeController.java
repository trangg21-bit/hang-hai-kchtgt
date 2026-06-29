package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKiemKe;
import com.hanghai.kchtg.assetmovement.service.TaiSanKiemKeService;
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

@RestController
@RequestMapping("/api/v1/asset/tai-san-kiem-ke")
@RequiredArgsConstructor
public class TaiSanKiemKeController {

    private final TaiSanKiemKeService taiSanKiemKeService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san-kiem-ke')")
    public ResponseEntity<ApiResponse<TaiSanKiemKeResponse>> create(
            @RequestBody TaiSanKiemKeRequest request) {
        TaiSanKiemKeResponse response = taiSanKiemKeService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tai san kiem ke da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san-kiem-ke')")
    public ResponseEntity<ApiResponse<TaiSanKiemKeResponse>> getById(
            @PathVariable UUID id) {
        TaiSanKiemKeResponse response = taiSanKiemKeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san-kiem-ke')")
    public ResponseEntity<ApiResponse<Page<TaiSanKiemKeResponse>>> findAll(
            @RequestParam(required = false) UUID keHoachId,
            @RequestParam(required = false) TrangThaiKiemKe trangThaiKiemKe,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<TaiSanKiemKeResponse> result;
        if (keHoachId != null && trangThaiKiemKe != null) {
            result = taiSanKiemKeService.findByKeHoachIdAndTrangThai(keHoachId, trangThaiKiemKe, pageable);
        } else if (trangThaiKiemKe != null) {
            result = taiSanKiemKeService.findByTrangThai(trangThaiKiemKe, pageable);
        } else if (keHoachId != null) {
            result = taiSanKiemKeService.findByKeHoachId(keHoachId, pageable);
        } else {
            result = taiSanKiemKeService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san-kiem-ke')")
    public ResponseEntity<ApiResponse<TaiSanKiemKeResponse>> update(
            @PathVariable UUID id,
            @RequestBody TaiSanKiemKeRequest request) {
        TaiSanKiemKeResponse response = taiSanKiemKeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tai san kiem ke da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san-kiem-ke')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        taiSanKiemKeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tai san kiem ke da duoc xoa", null));
    }
}
