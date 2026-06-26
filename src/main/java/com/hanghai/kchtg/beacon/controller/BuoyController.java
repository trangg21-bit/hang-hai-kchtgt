package com.hanghai.kchtg.beacon.controller;

import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.entity.BuoyType;
import com.hanghai.kchtg.beacon.service.BuoyService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Buoy CRUD + approval endpoints (F-074 to F-077).
 */
@RestController
@RequestMapping("/api/buoys")
@RequiredArgsConstructor
public class BuoyController {

    private final BuoyService buoyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuoyResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(buoyService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuoyResponse>> findById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(buoyService.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BuoyResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) BuoyType type,
            @RequestParam(required = false) BeaconStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                buoyService.search(name, code, type, status)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BuoyResponse>> create(
            @Valid @RequestBody CreateBuoyRequest request) {
        BuoyResponse response = buoyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phao tiêu thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BuoyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuoyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật phao tiêu thành công",
                buoyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        buoyService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa phao tiêu thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable UUID id) {
        buoyService.submitForApproval(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<BuoyResponse>> approveL1(
            @PathVariable UUID id, @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L1 thành công",
                buoyService.approveL1(id, approverId)));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<BuoyResponse>> approveL2(
            @PathVariable UUID id, @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L2 thành công — Đã công bố",
                buoyService.approveL2(id, approverId)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BuoyResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam String approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối",
                buoyService.reject(id, rejectReason, approverId)));
    }
}
