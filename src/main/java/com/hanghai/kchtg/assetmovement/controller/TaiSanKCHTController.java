package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTResponse;
import com.hanghai.kchtg.assetmovement.service.TaiSanKCHTService;
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
@RequestMapping("/api/v1/asset/tai-san")
@RequiredArgsConstructor
public class TaiSanKCHTController {

    private final TaiSanKCHTService taiSanService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san')")
    public ResponseEntity<ApiResponse<TaiSanKCHTResponse>> create(
            @RequestBody TaiSanKCHTRequest request) {
        TaiSanKCHTResponse response = taiSanService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tai san da duoc tang", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san')")
    public ResponseEntity<ApiResponse<TaiSanKCHTResponse>> getById(
            @PathVariable UUID id) {
        TaiSanKCHTResponse response = taiSanService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san')")
    public ResponseEntity<ApiResponse<Page<TaiSanKCHTResponse>>> findAll(
            @RequestParam(required = false) String maTaiSan,
            @RequestParam(required = false) UUID loaiTaiSanId,
            @RequestParam(required = false) String trangThai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<TaiSanKCHTResponse> result = taiSanService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san')")
    public ResponseEntity<ApiResponse<TaiSanKCHTResponse>> update(
            @PathVariable UUID id,
            @RequestBody TaiSanKCHTRequest request) {
        TaiSanKCHTResponse response = taiSanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tai san da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:tai-san')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        taiSanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tai san da duoc xoa", null));
    }
}
