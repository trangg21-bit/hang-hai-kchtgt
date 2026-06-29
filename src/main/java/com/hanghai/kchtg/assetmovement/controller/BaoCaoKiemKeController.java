package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeResponse;
import com.hanghai.kchtg.assetmovement.service.BaoCaoKiemKeService;
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
 * REST Controller cho Bao Cao Kiem Ke (F-125).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/bao-cao-kiem-ke")
@RequiredArgsConstructor
public class BaoCaoKiemKeController {

    private final BaoCaoKiemKeService baoCaoService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:bao-cao-kiem-ke')")
    public ResponseEntity<ApiResponse<BaoCaoKiemKeResponse>> create(
            @RequestBody BaoCaoKiemKeRequest request) {
        BaoCaoKiemKeResponse response = baoCaoService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Bao cao da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:bao-cao-kiem-ke')")
    public ResponseEntity<ApiResponse<BaoCaoKiemKeResponse>> getById(
            @PathVariable UUID id) {
        BaoCaoKiemKeResponse response = baoCaoService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:bao-cao-kiem-ke')")
    public ResponseEntity<ApiResponse<Page<BaoCaoKiemKeResponse>>> findAll(
            @RequestParam(required = false) UUID keHoachId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<BaoCaoKiemKeResponse> result;
        if (keHoachId != null) {
            result = baoCaoService.findByKeHoachId(keHoachId, pageable);
        } else {
            result = baoCaoService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:bao-cao-kiem-ke')")
    public ResponseEntity<ApiResponse<BaoCaoKiemKeResponse>> update(
            @PathVariable UUID id,
            @RequestBody BaoCaoKiemKeRequest request) {
        BaoCaoKiemKeResponse response = baoCaoService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bao cao da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:bao-cao-kiem-ke')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        baoCaoService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Bao cao da duoc xoa", null));
    }
}
