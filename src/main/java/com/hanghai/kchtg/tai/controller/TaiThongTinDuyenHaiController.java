package com.hanghai.kchtg.tai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.CreateTaiThongTinDuyenHaiRequest;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.TaiThongTinDuyenHaiResponse;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.UpdateTaiThongTinDuyenHaiRequest;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.service.TaiThongTinDuyenHaiService;
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
 * REST Controller cho CRUD + duyet + sync Tai Thong Tin Duyn Hai station (M-015).
 */
@RestController
@RequestMapping("/api/v1/tai/thong-tin-duyen-hai")
@RequiredArgsConstructor
@Slf4j
@Validated
public class TaiThongTinDuyenHaiController {

    private final TaiThongTinDuyenHaiService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'tai:create')")
    public ResponseEntity<ApiResponse<TaiThongTinDuyenHaiResponse>> create(
            @Valid @RequestBody CreateTaiThongTinDuyenHaiRequest request) {
        TaiThongTinDuyenHaiResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao tai thong tin duyen hai thanh cong", response));
    }

    @PutMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:update')")
    public ResponseEntity<ApiResponse<TaiThongTinDuyenHaiResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateTaiThongTinDuyenHaiRequest request) {
        UUID id = service.findByCode(code).getId();
        TaiThongTinDuyenHaiResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat tai thong tin duyen hai thanh cong", response));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa tai thong tin duyen hai thanh cong", null));
    }

    @GetMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<TaiThongTinDuyenHaiResponse>> findById(
            @PathVariable String code) {
        TaiThongTinDuyenHaiResponse response = service.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiThongTinDuyenHaiResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiThongTinDuyenHaiResponse>>> findByStatus(
            @PathVariable TaiStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.findAll().stream()
                        .filter(r -> r.getStatus() == status)
                        .toList()));
    }

    @GetMapping("/count-by-status")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiThongTinDuyenHaiResponse>>> countByStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping("/{code}/approve")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiThongTinDuyenHaiResponse>> approve(
            @PathVariable String code,
            @RequestParam(required = false) String remarks) {
        TaiThongTinDuyenHaiResponse response = service.approve(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Phe duyet thanh cong", response));
    }

    @PutMapping("/{code}/reject")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiThongTinDuyenHaiResponse>> reject(
            @PathVariable String code,
            @RequestParam String remarks) {
        TaiThongTinDuyenHaiResponse response = service.reject(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Tu choi thanh cong", response));
    }

    @PostMapping("/{code}/sync")
    @PreAuthorize("@auth.check(authentication, 'tai:sync')")
    public ResponseEntity<ApiResponse<Void>> syncToMapPhao(@PathVariable String code) {
        UUID id = service.findByCode(code).getId();
        service.syncToMapPhao(id);
        return ResponseEntity.ok(ApiResponse.success("Da dong bo thanh cong", null));
    }

    @DeleteMapping("/{code}/hide")
    @PreAuthorize("@auth.check(authentication, 'tai:sync')")
    public ResponseEntity<ApiResponse<Void>> hideFromMapPhao(@PathVariable String code) {
        UUID id = service.findByCode(code).getId();
        service.hideFromMapPhao(id);
        return ResponseEntity.ok(ApiResponse.success("Da anh xoa khoi ban do", null));
    }
}
