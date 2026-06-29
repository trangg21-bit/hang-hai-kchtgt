package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanResponse;
import com.hanghai.kchtg.assetmovement.service.YeuCauTangTaiSanService;
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
@RequestMapping("/api/v1/asset/yeu-cau-tang")
@RequiredArgsConstructor
public class YeuCauTangTaiSanController {

    private final YeuCauTangTaiSanService yeuCauService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-tang')")
    public ResponseEntity<ApiResponse<YeuCauTangTaiSanResponse>> create(
            @RequestBody YeuCauTangTaiSanRequest request) {
        YeuCauTangTaiSanResponse response = yeuCauService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Yeu cau tang da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-tang')")
    public ResponseEntity<ApiResponse<YeuCauTangTaiSanResponse>> getById(
            @PathVariable UUID id) {
        YeuCauTangTaiSanResponse response = yeuCauService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-tang')")
    public ResponseEntity<ApiResponse<Page<YeuCauTangTaiSanResponse>>> findAll(
            @RequestParam(required = false) UUID taiSanId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<YeuCauTangTaiSanResponse> result;
        if (taiSanId != null) {
            result = yeuCauService.findByTaiSanId(taiSanId, pageable);
        } else {
            result = yeuCauService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-tang')")
    public ResponseEntity<ApiResponse<YeuCauTangTaiSanResponse>> update(
            @PathVariable UUID id,
            @RequestBody YeuCauTangTaiSanRequest request) {
        YeuCauTangTaiSanResponse response = yeuCauService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Yeu cau tang da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:yeu-cau-tang')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        yeuCauService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yeu cau tang da duoc xoa", null));
    }
}
