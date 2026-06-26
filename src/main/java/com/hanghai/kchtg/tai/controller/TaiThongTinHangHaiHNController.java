package com.hanghai.kchtg.tai.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.dto.hanoi_hai.CreateTaiThongTinHangHaiHNRequest;
import com.hanghai.kchtg.tai.dto.hanoi_hai.TaiThongTinHangHaiHNResponse;
import com.hanghai.kchtg.tai.dto.hanoi_hai.UpdateTaiThongTinHangHaiHNRequest;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.service.TaiThongTinHangHaiHNService;
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
 * REST Controller cho CRUD + duyet + sync Tai Thong Tin Hang Hai HN station (M-015).
 */
@RestController
@RequestMapping("/api/v1/tai/thong-tin-hai-hai-hn")
@RequiredArgsConstructor
@Slf4j
@Validated
public class TaiThongTinHangHaiHNController {

    private final TaiThongTinHangHaiHNService service;

    @PostMapping
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_CREATE')")
    public ResponseEntity<ApiResponse<TaiThongTinHangHaiHNResponse>> create(
            @Valid @RequestBody CreateTaiThongTinHangHaiHNRequest request) {
        TaiThongTinHangHaiHNResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao tai thong tin hai hai hn thanh cong", response));
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_UPDATE')")
    public ResponseEntity<ApiResponse<TaiThongTinHangHaiHNResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateTaiThongTinHangHaiHNRequest request) {
        UUID id = service.findByCode(code).getId();
        TaiThongTinHangHaiHNResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Cap nhat tai thong tin hai hai hn thanh cong", response));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String code) {
        service.delete(code);
        return ResponseEntity.ok(
                ApiResponse.success("Da xoa tai thong tin hai hai hn thanh cong", null));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_READ')")
    public ResponseEntity<ApiResponse<TaiThongTinHangHaiHNResponse>> findById(
            @PathVariable String code) {
        TaiThongTinHangHaiHNResponse response = service.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_READ')")
    public ResponseEntity<ApiResponse<List<TaiThongTinHangHaiHNResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_READ')")
    public ResponseEntity<ApiResponse<List<TaiThongTinHangHaiHNResponse>>> findByStatus(
            @PathVariable TaiStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
                service.findAll().stream()
                        .filter(r -> r.getStatus() == status)
                        .toList()));
    }

    @GetMapping("/count-by-status")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_READ')")
    public ResponseEntity<ApiResponse<List<TaiThongTinHangHaiHNResponse>>> countByStatus() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping("/{code}/approve")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_APPROVE_L2')")
    public ResponseEntity<ApiResponse<TaiThongTinHangHaiHNResponse>> approve(
            @PathVariable String code,
            @RequestParam(required = false) String remarks) {
        TaiThongTinHangHaiHNResponse response = service.approve(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Phe duyet thanh cong", response));
    }

    @PutMapping("/{code}/reject")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_APPROVE_L2')")
    public ResponseEntity<ApiResponse<TaiThongTinHangHaiHNResponse>> reject(
            @PathVariable String code,
            @RequestParam String remarks) {
        TaiThongTinHangHaiHNResponse response = service.reject(code, remarks, UUID.randomUUID());
        return ResponseEntity.ok(ApiResponse.success(
                "Tu choi thanh cong", response));
    }

    @PostMapping("/{code}/sync")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_SYNC')")
    public ResponseEntity<ApiResponse<Void>> syncToMapPhao(@PathVariable String code) {
        UUID id = service.findByCode(code).getId();
        service.syncToMapPhao(id);
        return ResponseEntity.ok(ApiResponse.success("Da dong bo thanh cong", null));
    }

    @DeleteMapping("/{code}/hide")
    @PreAuthorize("hasRole('ROLE_DAI_TTDH_SYNC')")
    public ResponseEntity<ApiResponse<Void>> hideFromMapPhao(@PathVariable String code) {
        UUID id = service.findByCode(code).getId();
        service.hideFromMapPhao(id);
        return ResponseEntity.ok(ApiResponse.success("Da anh xoa khoi ban do", null));
    }
}
