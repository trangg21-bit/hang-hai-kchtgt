package com.hanghai.kchtg.assetmovement.controller;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.dto.AssetIncreaseRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetIncreaseRequestResponse;
import com.hanghai.kchtg.assetmovement.service.AssetIncreaseRequestService;
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
@RequestMapping("/api/v1/asset/asset-increase-requests")
@RequiredArgsConstructor
public class AssetIncreaseRequestController {

    private final AssetIncreaseRequestService assetIncreaseRequestService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<AssetIncreaseRequestResponse>> create(
            @RequestBody AssetIncreaseRequestRequest request) {
        AssetIncreaseRequestResponse response = assetIncreaseRequestService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Yêu cầu tăng tài sản đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<AssetIncreaseRequestResponse>> getById(
            @PathVariable UUID id) {
        AssetIncreaseRequestResponse response = assetIncreaseRequestService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<Page<AssetIncreaseRequestResponse>>> findAll(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<AssetIncreaseRequestResponse> result;
        if (assetId != null) {
            result = assetIncreaseRequestService.findByAssetId(assetId, pageable);
        } else {
            result = assetIncreaseRequestService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<AssetIncreaseRequestResponse>> update(
            @PathVariable UUID id,
            @RequestBody AssetIncreaseRequestRequest request) {
        AssetIncreaseRequestResponse response = assetIncreaseRequestService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu tăng đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        assetIncreaseRequestService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu tăng đã được xóa", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<AssetIncreaseRequestResponse>> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        AssetIncreaseRequestResponse response = assetIncreaseRequestService.approve(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu tăng đã được phê duyệt", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'assetincrease:manage')")
    public ResponseEntity<ApiResponse<AssetIncreaseRequestResponse>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        AssetIncreaseRequestResponse response = assetIncreaseRequestService.reject(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu tăng đã bị từ chối", response));
    }
}
