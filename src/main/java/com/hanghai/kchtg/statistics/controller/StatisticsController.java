package com.hanghai.kchtg.statistics.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.statistics.dto.StatisticsFilter;
import com.hanghai.kchtg.statistics.dto.StatisticsFormRequest;
import com.hanghai.kchtg.statistics.dto.StatisticsFormResponse;
import com.hanghai.kchtg.statistics.dto.StatisticsSummary;
import com.hanghai.kchtg.statistics.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for chuyên đề statistics forms (Biểu) — M-017.
 * Covers CRUD, status management, counting and summary for all 28 biểu types.
 */
@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
@Slf4j
@Validated
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * Create a new statistics form (Biểu) with initial status DRAFT.
     */
    @PostMapping("/forms")
    public ResponseEntity<ApiResponse<StatisticsFormResponse>> createForm(
            @Valid @RequestBody StatisticsFormRequest request) {
        log.info("Creating statistics form: type={}, period={}",
                request.getFormType(), request.getReportingPeriod());
        StatisticsFormResponse response = statisticsService.createForm(request);
        return ResponseEntity.ok(
                ApiResponse.success("Tao form thong ke thành công", response));
    }

    /**
     * Find a statistics form by its database ID.
     */
    @GetMapping("/forms/{id}")
    public ResponseEntity<ApiResponse<StatisticsFormResponse>> findById(
            @PathVariable Long id) {
        log.info("Finding statistics form by id={}", id);
        return statisticsService.findById(id)
                .map(response -> ResponseEntity.ok(
                        ApiResponse.success("Da tim thay form", response)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Find a statistics form by its business code (e.g. "F01N-2026-06").
     */
    @GetMapping("/forms/code/{code}")
    public ResponseEntity<ApiResponse<StatisticsFormResponse>> findByCode(
            @PathVariable String code) {
        log.info("Finding statistics form by code={}", code);
        return statisticsService.findByCode(code)
                .map(response -> ResponseEntity.ok(
                        ApiResponse.success("Da tim thay form", response)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List all statistics forms with optional filtering and pagination.
     * Supports query params: formType, formStatus, reportingPeriod, periodType, year.
     */
    @GetMapping("/forms")
    public ResponseEntity<ApiResponse<Page<StatisticsFormResponse>>> findAll(
            @ModelAttribute StatisticsFilter filter) {
        log.info("Listing statistics forms with filter: {}", filter);
        Page<StatisticsFormResponse> page = statisticsService.findAll(filter);
        return ResponseEntity.ok(
                ApiResponse.success("Da lay danh sach form", page));
    }

    /**
     * List all forms of a specific type (e.g. PORT_THROUGHPUT, DOCK_CAPACITY).
     */
    @GetMapping("/forms/type/{formType}")
    public ResponseEntity<ApiResponse<?>> findByFormType(
            @PathVariable String formType) {
        log.info("Finding statistics forms by formType={}", formType);
        return ResponseEntity.ok(
                ApiResponse.success("Da tim theo loai form",
                        statisticsService.findByFormType(formType)));
    }

    /**
     * Update the status of a statistics form (DRAFT, SUBMITTED, APPROVED, REJECTED).
     */
    @PutMapping("/forms/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        log.info("Updating form [{}] status to {}", id, status);
        statisticsService.updateStatus(id, status);
        return ResponseEntity.ok(
                ApiResponse.success("Da cap nhat trang thai form", null));
    }

    /**
     * Count the number of statistics forms with a given status.
     */
    @GetMapping("/forms/count-by-status/{status}")
    public ResponseEntity<ApiResponse<Long>> countByStatus(
            @PathVariable String status) {
        log.info("Counting forms by status={}", status);
        long count = statisticsService.countByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.success("Dem form theo trang thai", count));
    }

    /**
     * Retrieve an aggregated summary of all statistics forms.
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<StatisticsSummary>> getSummary() {
        log.info("Fetching statistics summary");
        StatisticsSummary summary = statisticsService.getSummary();
        return ResponseEntity.ok(
                ApiResponse.success("Lay tong ket thong ke thành công", summary));
    }
}
