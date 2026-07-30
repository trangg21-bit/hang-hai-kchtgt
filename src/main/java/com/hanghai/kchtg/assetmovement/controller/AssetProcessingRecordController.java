package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.AssetProcessingRecordRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetProcessingRecordResponse;
import com.hanghai.kchtg.assetmovement.entity.ProcessingType;
import com.hanghai.kchtg.assetmovement.service.AssetProcessingRecordService;
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
 * REST Controller cho Ho So Xu Ly Tai San (F-124).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/asset-processing-records")
@RequiredArgsConstructor
public class AssetProcessingRecordController {

    private final AssetProcessingRecordService assetProcessingRecordService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'processingrecord:manage')")
    public ResponseEntity<ApiResponse<AssetProcessingRecordResponse>> create(
            @RequestBody AssetProcessingRecordRequest request) {
        AssetProcessingRecordResponse response = assetProcessingRecordService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Hồ sơ đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'processingrecord:manage')")
    public ResponseEntity<ApiResponse<AssetProcessingRecordResponse>> getById(
            @PathVariable UUID id) {
        AssetProcessingRecordResponse response = assetProcessingRecordService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'processingrecord:manage')")
    public ResponseEntity<ApiResponse<Page<AssetProcessingRecordResponse>>> findAll(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(required = false) ProcessingType processingType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<AssetProcessingRecordResponse> result;
        if (assetId != null && processingType != null) {
            result = assetProcessingRecordService.findByAssetIdAndProcessingType(assetId, processingType, pageable);
        } else if (processingType != null) {
            result = assetProcessingRecordService.findByProcessingType(processingType, pageable);
        } else if (assetId != null) {
            result = assetProcessingRecordService.findByAssetId(assetId, pageable);
        } else {
            result = assetProcessingRecordService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'processingrecord:manage')")
    public ResponseEntity<ApiResponse<AssetProcessingRecordResponse>> update(
            @PathVariable UUID id,
            @RequestBody AssetProcessingRecordRequest request) {
        AssetProcessingRecordResponse response = assetProcessingRecordService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Hồ sơ đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'processingrecord:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        assetProcessingRecordService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Hồ sơ đã được xóa", null));
    }
}
