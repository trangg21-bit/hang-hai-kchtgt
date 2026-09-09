package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.service.InfraAssetService;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.security.annotation.DataScope;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/asset/infra-assets")
@RequiredArgsConstructor
@DataScope
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
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) UUID parentOrgUnitId,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID usingOrgUnitId,
            @RequestParam(required = false) UUID berthId,
            @RequestParam(required = false) InfraAssetType assetType,
            @RequestParam(required = false) String assetCondition,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) LocalDate updatedFrom,
            @RequestParam(required = false) LocalDate updatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(EntityFields.CREATED_AT).descending());
        Page<InfraAssetResponse> result = infraAssetService.findAll(assetCode, assetName, parentOrgUnitId, orgUnitId,
                usingOrgUnitId, berthId, assetType, assetCondition, approvalStatus, updatedFrom, updatedTo, pageable);
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
