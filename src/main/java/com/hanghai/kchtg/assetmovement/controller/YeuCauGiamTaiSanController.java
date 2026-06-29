package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanResponse;
import com.hanghai.kchtg.assetmovement.service.YeuCauGiamTaiSanService;
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
@RequestMapping("/api/v1/asset/yeu-cau-giam")
@RequiredArgsConstructor
public class YeuCauGiamTaiSanController {

    private final YeuCauGiamTaiSanService yeuCauService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-giam')")
    public ResponseEntity<ApiResponse<YeuCauGiamTaiSanResponse>> create(
            @RequestBody YeuCauGiamTaiSanRequest request) {
        YeuCauGiamTaiSanResponse response = yeuCauService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Yeu cau giam da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-giam')")
    public ResponseEntity<ApiResponse<YeuCauGiamTaiSanResponse>> getById(
            @PathVariable UUID id) {
        YeuCauGiamTaiSanResponse response = yeuCauService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-giam')")
    public ResponseEntity<ApiResponse<Page<YeuCauGiamTaiSanResponse>>> findAll(
            @RequestParam(required = false) UUID taiSanId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<YeuCauGiamTaiSanResponse> result;
        if (taiSanId != null) {
            result = yeuCauService.findByTaiSanId(taiSanId, pageable);
        } else {
            result = yeuCauService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-giam')")
    public ResponseEntity<ApiResponse<YeuCauGiamTaiSanResponse>> update(
            @PathVariable UUID id,
            @RequestBody YeuCauGiamTaiSanRequest request) {
        YeuCauGiamTaiSanResponse response = yeuCauService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Yeu cau giam da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-giam')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        yeuCauService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yeu cau giam da duoc xoa", null));
    }
}
