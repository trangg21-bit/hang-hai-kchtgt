package com.hanghai.kchtg.report.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.dto.Bcc157CreateRequest;
import com.hanghai.kchtg.report.dto.Bcc157Response;
import com.hanghai.kchtg.report.dto.Bcc157SearchRequest;
import com.hanghai.kchtg.report.service.Bcc157Service;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for BCC_157 (F-142) CRUD operations.
 * Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng đơn vị
 * được giao quản lý nhưng không trực tiếp khai thác, sử dụng.
 */
@RestController
@RequestMapping("/api/v1/bcc157")
@RequiredArgsConstructor
@Slf4j
public class Bcc157Controller {

    private final Bcc157Service bcc157Service;

    /**
     * POST /api/v1/bcc157 — Create a new BCC_157 report.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'report:create')")
    public ResponseEntity<ApiResponse<Bcc157Response>> create(
            @Valid @RequestBody Bcc157CreateRequest request) {
        try {
            Bcc157Response response = bcc157Service.create(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo báo cáo thành công", response));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/v1/bcc157 — Search BCC_157 reports.
     * Query params: orgUnitId, reportYear, nguonDuLieu (all optional).
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<List<Bcc157Response>>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) Integer reportYear,
            @RequestParam(required = false) String nguonDuLieu) {

        Bcc157SearchRequest request = Bcc157SearchRequest.builder()
                .orgUnitId(orgUnitId)
                .reportYear(reportYear)
                .nguonDuLieu(nguonDuLieu)
                .build();

        List<Bcc157Response> results = bcc157Service.search(request);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * GET /api/v1/bcc157/{id} — Get a BCC_157 report by id.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<Bcc157Response>> getById(@PathVariable UUID id) {
        try {
            Bcc157Response response = bcc157Service.getById(id);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * DELETE /api/v1/bcc157/{id} — Delete a BCC_157 report by id.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'report:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        try {
            bcc157Service.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa báo cáo thành công", null));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
