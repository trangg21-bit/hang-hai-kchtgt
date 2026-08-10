package com.hanghai.kchtg.dashboard;

import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.repository.MovementRequestRepository;
import com.hanghai.kchtg.assetmovement.dto.AssetProcessingRecordResponse;
import com.hanghai.kchtg.assetmovement.service.AssetProcessingRecordService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dashboard.service.KchtAssetCountService;
import com.hanghai.kchtg.integration.dto.AssetStatusDto;
import com.hanghai.kchtg.integration.entity.CargoAggregate;
import com.hanghai.kchtg.integration.repository.CargoAggregateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dashboard aggregation controller — cung cấp số liệu tổng hợp cho trang chủ.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final KchtAssetCountService kchtAssetCountService;
    private final MovementRequestRepository movementRequestRepo;
    private final CargoAggregateRepository cargoAggregateRepository;
    private final AssetProcessingRecordService assetProcessingRecordService;

    /**
     * GET /api/v1/dashboard/approval-kcht
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho KCHT.
     */
    @GetMapping("/approval-kcht")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getKchtApprovalStats() {
        // Giữ endpoint cũ nhưng dùng chung phép tổng hợp đã cache.
        return ResponseEntity.ok(ApiResponse.success(
                kchtAssetCountService.getApprovalStats(null, null)
        ));
    }

    /**
     * GET /api/v1/dashboard/approval-asset
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho yêu cầu biến động tài sản.
     */
    @GetMapping("/approval-asset")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssetApprovalStats() {
        long approved = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                RequestStatus.APPROVED);
        long pending = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                RequestStatus.PENDING);
        long rejected = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                RequestStatus.REJECTED);

        long total = approved + pending + rejected;

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", total,
                "approved", approved,
                "pending", pending,
                "rejected", rejected
        )));
    }

    @GetMapping("/ports/cargo-total")
    public ResponseEntity<ApiResponse<Page<CargoAggregate>>> getPortCargoTotal(
            @RequestParam(required = false) String province,
            @PageableDefault(size = 20, sort = "periodStart", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CargoAggregate> page = province == null
                ? cargoAggregateRepository.findByPeriodType("ANNUAL", pageable)
                : cargoAggregateRepository.findByPeriodTypeAndProvinceId("ANNUAL", province, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/cargo/summary")
    public ResponseEntity<ApiResponse<Page<CargoAggregate>>> getCargoSummary(
            @RequestParam(required = false) String portCode,
            @RequestParam(required = false) String periodType,
            @RequestParam(required = false) String province,
            @PageableDefault(size = 20, sort = "periodStart", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CargoAggregate> page;
        if (portCode != null && !portCode.isBlank() && periodType != null && !periodType.isBlank()) {
            page = cargoAggregateRepository.findByPortCodeAndPeriodType(portCode, periodType, pageable);
        } else if (portCode != null && !portCode.isBlank()) {
            page = cargoAggregateRepository.findByPortCode(portCode, pageable);
        } else if (periodType != null && !periodType.isBlank() && province != null) {
            page = cargoAggregateRepository.findByPeriodTypeAndProvinceId(periodType, province, pageable);
        } else if (periodType != null && !periodType.isBlank()) {
            page = cargoAggregateRepository.findByPeriodType(periodType, pageable);
        } else if (province != null) {
            page = cargoAggregateRepository.findByProvinceId(province, pageable);
        } else {
            page = cargoAggregateRepository.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/assets/status")
    public ResponseEntity<ApiResponse<AssetStatusDto>> getAssetStatus(
            @RequestParam(required = false) Integer year,
            @RequestParam(value = "province", required = false) Integer provinceId,
            @RequestParam(required = false) String infraType) {

        List<Map<String, Object>> breakdown =
                kchtAssetCountService.getInfraTableData(year, provinceId, infraType);
        boolean filterByInfraType = infraType != null && !infraType.isBlank();
        long totalAssets = filterByInfraType
                ? sumBreakdown(breakdown, "total")
                : kchtAssetCountService.countTotal(year, provinceId);
        long operatingAssets = filterByInfraType
                ? sumBreakdown(breakdown, "operating")
                : kchtAssetCountService.countOperating(year, provinceId);
        Map<String, Long> assetsByStatus = new LinkedHashMap<>();
        assetsByStatus.put("PUBLISHED", operatingAssets);
        assetsByStatus.put("TOTAL", totalAssets);

        AssetStatusDto dto = AssetStatusDto.builder()
                .totalAssets(totalAssets)
                .assetsByStatus(assetsByStatus)
                .approvalStats(kchtAssetCountService.getApprovalStats(year, provinceId, infraType))
                .breakdown(breakdown)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    private long sumBreakdown(List<Map<String, Object>> breakdown, String field) {
        return breakdown.stream()
                .map(row -> row.get(field))
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .mapToLong(Number::longValue)
                .sum();
    }

    @GetMapping("/asset-processing-records")
    public ResponseEntity<ApiResponse<Page<AssetProcessingRecordResponse>>> getAssetProcessingRecords(
            @PageableDefault(size = 500) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(assetProcessingRecordService.findAll(pageable)));
    }
}
