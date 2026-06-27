package com.hanghai.kchtg.tai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.dto.inmarsat.CreateTaiInmarsatRequest;
import com.hanghai.kchtg.tai.dto.inmarsat.TaiInmarsatResponse;
import com.hanghai.kchtg.tai.dto.inmarsat.UpdateTaiInmarsatRequest;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.service.TaiInmarsatService;
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
 * REST Controller cho CRUD + duyet + sync Tai Inmarsat station (M-015).
 */
@RestController
@RequestMapping("/api/v1/tai/inmarsat")
@RequiredArgsConstructor
@Slf4j
@Validated
public class TaiInmarsatController {

    private final TaiInmarsatService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'tai:create')")
    public ResponseEntity<ApiResponse<TaiInmarsatResponse>> create(
            @Valid @RequestBody CreateTaiInmarsatRequest request) {
        TaiInmarsatResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao tai inmarsat thanh cong", response));
    }

    @PutMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:update')")
    public ResponseEntity<ApiResponse<TaiInmarsatResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateTaiInmarsatRequest request) {
        UUID id = service.findByCode(code).getId();
        TaiInmarsatResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat tai inmarsat thanh cong", response));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa tai inmarsat thanh cong", null));
    }

    @GetMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<TaiInmarsatResponse>> findById(
            @PathVariable String code) {
        TaiInmarsatResponse response = service.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiInmarsatResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiInmarsatResponse>>> findByStatus(
            @PathVariable TaiStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.findAll().stream()
                        .filter(r -> r.getStatus() == status)
                        .toList()));
    }

    @GetMapping("/count-by-status")
    @PreAuthorize("@auth.check(authentication, 'tai:read')")
    public ResponseEntity<ApiResponse<List<TaiInmarsatResponse>>> countByStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping("/{code}/approve")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiInmarsatResponse>> approve(
            @PathVariable String code,
            @RequestParam(required = false) String remarks) {
        TaiInmarsatResponse response = service.approve(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Phe duyet thanh cong", response));
    }

    @PutMapping("/{code}/reject")
    @PreAuthorize("@auth.check(authentication, 'tai:approve')")
    public ResponseEntity<ApiResponse<TaiInmarsatResponse>> reject(
            @PathVariable String code,
            @RequestParam String remarks) {
        TaiInmarsatResponse response = service.reject(code, remarks, UUID.randomUUID());
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
