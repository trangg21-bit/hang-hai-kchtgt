package com.hanghai.kchtg.tai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.dto.cospassarsat.CreateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.dto.cospassarsat.TaiCospasSarsatResponse;
import com.hanghai.kchtg.tai.dto.cospassarsat.UpdateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.service.TaiCospasSarsatService;
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
 * REST Controller cho CRUD + duyet + sync Tai Cospas-Sarsat station (M-015).
 */
@RestController
@RequestMapping("/api/v1/tai/cospas-sarsat")
@RequiredArgsConstructor
@Slf4j
@Validated
public class TaiCospasSarsatController {

    private final TaiCospasSarsatService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'tai:create')")
    public ResponseEntity<ApiResponse<TaiCospasSarsatResponse>> create(
            @Valid @RequestBody CreateTaiCospasSarsatRequest request) {
        TaiCospasSarsatResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao tai cospas-sarsat thanh cong", response));
    }

    @PutMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:update')")
    public ResponseEntity<ApiResponse<TaiCospasSarsatResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateTaiCospasSarsatRequest request) {
        UUID id = service.findByCode(code).getId();
        TaiCospasSarsatResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat tai cospas-sarsat thanh cong", response));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa tai cospas-sarsat thanh cong", null));
    }

    @GetMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<TaiCospasSarsatResponse>> findById(
            @PathVariable String code) {
        TaiCospasSarsatResponse response = service.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiCospasSarsatResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiCospasSarsatResponse>>> findByStatus(
            @PathVariable TaiStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.findAll().stream()
                        .filter(r -> r.getStatus() == status)
                        .toList()));
    }

    @GetMapping("/count-by-status")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiCospasSarsatResponse>>> countByStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping("/{code}/approve")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiCospasSarsatResponse>> approve(
            @PathVariable String code,
            @RequestParam(required = false) String remarks) {
        TaiCospasSarsatResponse response = service.approve(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Phe duyet thanh cong", response));
    }

    @PutMapping("/{code}/reject")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiCospasSarsatResponse>> reject(
            @PathVariable String code,
            @RequestParam String remarks) {
        TaiCospasSarsatResponse response = service.reject(code, remarks, UUID.randomUUID());
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
