package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.assetmovement.dto.ApprovalRecordRequest;
import com.hanghai.kchtg.assetmovement.dto.ApprovalRecordResponse;
import com.hanghai.kchtg.assetmovement.entity.ApprovalResult;
import com.hanghai.kchtg.assetmovement.service.ApprovalRecordService;
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
 * REST Controller cho Luu Phe Duyet (F-127).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/approval-records")
@RequiredArgsConstructor
public class ApprovalRecordController {

    private final ApprovalRecordService approvalRecordService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'approvalrecord:manage')")
    public ResponseEntity<ApiResponse<ApprovalRecordResponse>> create(
            @RequestBody ApprovalRecordRequest request) {
        ApprovalRecordResponse response = approvalRecordService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Bản ghi phê duyệt đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'approvalrecord:manage')")
    public ResponseEntity<ApiResponse<ApprovalRecordResponse>> getById(
            @PathVariable UUID id) {
        ApprovalRecordResponse response = approvalRecordService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'approvalrecord:manage')")
    public ResponseEntity<ApiResponse<Page<ApprovalRecordResponse>>> findAll(
            @RequestParam(required = false) UUID requestId,
            @RequestParam(required = false) ApprovalResult result,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(EntityFields.CREATED_AT).descending());
        Page<ApprovalRecordResponse> pageResult;
        if (requestId != null && result != null) {
            pageResult = approvalRecordService.findByRequestIdAndResult(requestId, result, pageable);
        } else if (result != null) {
            pageResult = approvalRecordService.findByResult(result, pageable);
        } else if (requestId != null) {
            pageResult = approvalRecordService.findByRequestId(requestId, pageable);
        } else {
            pageResult = approvalRecordService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(pageResult));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'approvalrecord:manage')")
    public ResponseEntity<ApiResponse<ApprovalRecordResponse>> update(
            @PathVariable UUID id,
            @RequestBody ApprovalRecordRequest request) {
        ApprovalRecordResponse response = approvalRecordService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Lưu phê duyệt đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'approvalrecord:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        approvalRecordService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Lưu phê duyệt đã được xóa", null));
    }
}
