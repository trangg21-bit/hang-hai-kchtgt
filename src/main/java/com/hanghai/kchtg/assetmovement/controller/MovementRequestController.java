package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.MovementRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.MovementRequestResponse;
import com.hanghai.kchtg.assetmovement.entity.MovementType;
import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.service.MovementRequestService;
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
 * REST Controller cho Yeu Cau Bien Dong (F-127).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/movement-requests")
@RequiredArgsConstructor
public class MovementRequestController {

    private final MovementRequestService movementRequestService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'movementrequest:manage')")
    public ResponseEntity<ApiResponse<MovementRequestResponse>> create(
            @RequestBody MovementRequestRequest request) {
        MovementRequestResponse response = movementRequestService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Yêu cầu biến động đã được tạo thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'movementrequest:manage')")
    public ResponseEntity<ApiResponse<MovementRequestResponse>> getById(
            @PathVariable UUID id) {
        MovementRequestResponse response = movementRequestService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'movementrequest:manage')")
    public ResponseEntity<ApiResponse<Page<MovementRequestResponse>>> findAll(
            @RequestParam(required = false) MovementType movementType,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<MovementRequestResponse> result;
        if (movementType != null && status != null) {
            result = movementRequestService.findByMovementTypeAndStatus(movementType, status, pageable);
        } else if (status != null) {
            result = movementRequestService.findByStatus(status, pageable);
        } else if (movementType != null) {
            result = movementRequestService.findByMovementType(movementType, pageable);
        } else {
            result = movementRequestService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'movementrequest:manage')")
    public ResponseEntity<ApiResponse<MovementRequestResponse>> update(
            @PathVariable UUID id,
            @RequestBody MovementRequestRequest request) {
        MovementRequestResponse response = movementRequestService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu biến động đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'movementrequest:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        movementRequestService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu biến động đã được xóa", null));
    }
}
