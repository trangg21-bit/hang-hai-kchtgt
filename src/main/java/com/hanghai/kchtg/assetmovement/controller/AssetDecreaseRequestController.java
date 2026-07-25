package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.AssetDecreaseRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetDecreaseRequestResponse;
import com.hanghai.kchtg.assetmovement.service.AssetDecreaseRequestService;
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
@RequestMapping("/api/v1/asset/asset-decrease-requests")
@RequiredArgsConstructor
public class AssetDecreaseRequestController {

    private final AssetDecreaseRequestService assetDecreaseRequestService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<AssetDecreaseRequestResponse>> create(
            @RequestBody AssetDecreaseRequestRequest request) {
        AssetDecreaseRequestResponse response = assetDecreaseRequestService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Yêu cầu giảm tài sản đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<AssetDecreaseRequestResponse>> getById(
            @PathVariable UUID id) {
        AssetDecreaseRequestResponse response = assetDecreaseRequestService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<Page<AssetDecreaseRequestResponse>>> findAll(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<AssetDecreaseRequestResponse> result;
        if (assetId != null) {
            result = assetDecreaseRequestService.findByAssetId(assetId, pageable);
        } else {
            result = assetDecreaseRequestService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<AssetDecreaseRequestResponse>> update(
            @PathVariable UUID id,
            @RequestBody AssetDecreaseRequestRequest request) {
        AssetDecreaseRequestResponse response = assetDecreaseRequestService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu giảm đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        assetDecreaseRequestService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu giảm đã được xóa", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<AssetDecreaseRequestResponse>> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        AssetDecreaseRequestResponse response = assetDecreaseRequestService.approve(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu giảm đã được phê duyệt", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'asset:decrease-request')")
    public ResponseEntity<ApiResponse<AssetDecreaseRequestResponse>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        AssetDecreaseRequestResponse response = assetDecreaseRequestService.reject(id, remarks);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu giảm đã bị từ chối", response));
    }
}
