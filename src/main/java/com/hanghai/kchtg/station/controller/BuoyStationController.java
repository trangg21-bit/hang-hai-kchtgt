package com.hanghai.kchtg.station.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.station.dto.buoy.BuoyStationResponse;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.station.dto.buoy.UpdateBuoyStationRequest;
import com.hanghai.kchtg.station.service.BuoyStationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller cho CRUD + duyet nha tram phao (F-080 den F-085).
 */
@RestController
@RequestMapping("/api/v1/buoy-station")
@RequiredArgsConstructor
public class BuoyStationController {

    private final BuoyStationService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuoyStationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> findById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BuoyStationResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.search(name, code, type, status)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BuoyStationResponse>> create(
            @Valid @RequestBody CreateBuoyStationRequest request) {
        BuoyStationResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao nhà trạm phao thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuoyStationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat nhà trạm phao thành công",
                service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa nhà trạm phao thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable UUID id) {
        service.submitForApproval(id);
        return ResponseEntity.ok(
                ApiResponse.success("Da gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> approveL1(
            @PathVariable UUID id, @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L1 thành công",
                service.approveL1(id, approverId)));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> approveL2(
            @PathVariable UUID id, @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L2 thành công — Da cong bo",
                service.approveL2(id, approverId)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Da từ chối",
                service.reject(id, rejectReason, approverId)));
    }
}

