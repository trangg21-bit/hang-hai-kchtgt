package com.hanghai.kchtg.tai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.dto.lrit.CreateTaiLRITRequest;
import com.hanghai.kchtg.tai.dto.lrit.TaiLRITResponse;
import com.hanghai.kchtg.tai.dto.lrit.UpdateTaiLRITRequest;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.service.TaiLRITService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller cho CRUD + duyet + sync Tai LRIT station (M-015).
 */
@RestController
@RequestMapping("/api/v1/tai/lrit")
@RequiredArgsConstructor
@Slf4j
@Validated
public class TaiLRITController {

    private final TaiLRITService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'tai:create')")
    public ResponseEntity<ApiResponse<TaiLRITResponse>> create(
            @Valid @RequestBody CreateTaiLRITRequest request) {
        TaiLRITResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao tai lrit thành công", response));
    }

    @PutMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:update')")
    public ResponseEntity<ApiResponse<TaiLRITResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateTaiLRITRequest request) {
        UUID id = service.findByCode(code).getId();
        TaiLRITResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat tai lrit thành công", response));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa tai lrit thành công", null));
    }

    @GetMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<TaiLRITResponse>> findById(
            @PathVariable String code) {
        TaiLRITResponse response = service.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiLRITResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiLRITResponse>>> findByStatus(
            @PathVariable TaiStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.findAll().stream()
                        .filter(r -> r.getStatus() == status)
                        .toList()));
    }

    @GetMapping("/count-by-status")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiLRITResponse>>> countByStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping("/{code}/approve")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiLRITResponse>> approve(
            @PathVariable String code,
            @RequestParam(required = false) String remarks) {
        TaiLRITResponse response = service.approve(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt thành công", response));
    }

    @PutMapping("/{code}/reject")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiLRITResponse>> reject(
            @PathVariable String code,
            @RequestParam String remarks) {
        TaiLRITResponse response = service.reject(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Từ chối thành công", response));
    }

    @PostMapping("/{code}/sync")
    @PreAuthorize("@auth.check(authentication, 'tai:sync')")
    public ResponseEntity<ApiResponse<Void>> syncToMapPhao(@PathVariable String code) {
        UUID id = service.findByCode(code).getId();
        service.syncToMapPhao(id);
        return ResponseEntity.ok(ApiResponse.success("Da dong bo thành công", null));
    }

    @DeleteMapping("/{code}/hide")
    @PreAuthorize("@auth.check(authentication, 'tai:sync')")
    public ResponseEntity<ApiResponse<Void>> hideFromMapPhao(@PathVariable String code) {
        UUID id = service.findByCode(code).getId();
        service.hideFromMapPhao(id);
        return ResponseEntity.ok(ApiResponse.success("Đã ẩn/xóa khỏi bản đồ", null));
    }
}
