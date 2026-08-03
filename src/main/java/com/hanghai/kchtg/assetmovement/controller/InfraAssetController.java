package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.service.InfraAssetService;
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
@RequestMapping("/api/v1/asset/infra-assets")
@RequiredArgsConstructor
public class InfraAssetController {

    private final InfraAssetService infraAssetService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> create(
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = infraAssetService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản đã được tăng", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> getById(
            @PathVariable UUID id) {
        InfraAssetResponse response = infraAssetService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Page<InfraAssetResponse>>> findAll(
            @RequestParam(required = false) String assetCode,
            @RequestParam(required = false) UUID assetTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(EntityFields.CREATED_AT).descending());
        Page<InfraAssetResponse> result = infraAssetService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = infraAssetService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        infraAssetService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đã được xóa", null));
    }
}
