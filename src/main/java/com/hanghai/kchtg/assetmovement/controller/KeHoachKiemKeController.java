package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKeHoach;
import com.hanghai.kchtg.assetmovement.service.KeHoachKiemKeService;
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
@RequestMapping("/api/v1/asset/ke-hoach-kiem-ke")
@RequiredArgsConstructor
public class KeHoachKiemKeController {

    private final KeHoachKiemKeService keHoachService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:ke-hoach-kiem-ke')")
    public ResponseEntity<ApiResponse<KeHoachKiemKeResponse>> create(
            @RequestBody KeHoachKiemKeRequest request) {
        KeHoachKiemKeResponse response = keHoachService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Ke hoach da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:ke-hoach-kiem-ke')")
    public ResponseEntity<ApiResponse<KeHoachKiemKeResponse>> getById(
            @PathVariable UUID id) {
        KeHoachKiemKeResponse response = keHoachService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:ke-hoach-kiem-ke')")
    public ResponseEntity<ApiResponse<Page<KeHoachKiemKeResponse>>> findAll(
            @RequestParam(required = false) TrangThaiKeHoach trangThai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<KeHoachKiemKeResponse> result;
        if (trangThai != null) {
            result = keHoachService.findByTrangThai(trangThai, pageable);
        } else {
            result = keHoachService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:ke-hoach-kiem-ke')")
    public ResponseEntity<ApiResponse<KeHoachKiemKeResponse>> update(
            @PathVariable UUID id,
            @RequestBody KeHoachKiemKeRequest request) {
        KeHoachKiemKeResponse response = keHoachService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Ke hoach da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:ke-hoach-kiem-ke')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        keHoachService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Ke hoach da duoc xoa", null));
    }
}
