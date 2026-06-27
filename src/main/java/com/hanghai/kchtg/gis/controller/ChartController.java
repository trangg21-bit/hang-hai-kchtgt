package com.hanghai.kchtg.gis.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.entity.ChartCell;
import com.hanghai.kchtg.gis.entity.ChartFeature;
import com.hanghai.kchtg.gis.entity.S63Permit;
import com.hanghai.kchtg.gis.service.ChartIntegrationService;
import com.hanghai.kchtg.gis.service.CoordinateCalibrationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/gis/charts")
@RequiredArgsConstructor
@PreAuthorize("@auth.check(authentication, 'admin:manage')")
public class ChartController {

    private final ChartIntegrationService chartIntegrationService;
    private final CoordinateCalibrationService coordinateCalibrationService;

    // ========================================================================
    // S-57 / S-63 Chart Import Endpoints
    // ========================================================================

    @PostMapping("/s57/import")
    public ResponseEntity<ApiResponse<ChartCell>> importS57(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng tải lên file hải đồ S-57 hợp lệ"));
        }
        ChartCell cell = chartIntegrationService.importS57(file.getBytes(), file.getOriginalFilename());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nhập hải đồ S-57 thành công", cell));
    }

    @PostMapping("/s63/import")
    public ResponseEntity<ApiResponse<ChartCell>> importS63(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng tải lên file hải đồ S-63 hợp lệ"));
        }
        ChartCell cell = chartIntegrationService.importS63(file.getBytes(), file.getOriginalFilename());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nhập hải đồ S-63 thành công", cell));
    }

    @GetMapping("/cells")
    public ResponseEntity<ApiResponse<List<ChartCell>>> getAllCells() {
        return ResponseEntity.ok(ApiResponse.success(chartIntegrationService.getAllCells()));
    }

    @GetMapping("/cells/{id}/features")
    public ResponseEntity<ApiResponse<List<ChartFeature>>> getFeatures(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(chartIntegrationService.getFeatures(id)));
    }

    @GetMapping("/cells/{id}/s52-styled")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getS52StyledFeatures(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "DAY") String palette) {
        return ResponseEntity.ok(ApiResponse.success(chartIntegrationService.getS52StyledFeatures(id, palette)));
    }

    // ========================================================================
    // S-63 Permits Management Endpoints
    // ========================================================================

    @GetMapping("/permits")
    public ResponseEntity<ApiResponse<List<S63Permit>>> getAllPermits() {
        return ResponseEntity.ok(ApiResponse.success(chartIntegrationService.getAllPermits()));
    }

    @PostMapping("/permits")
    public ResponseEntity<ApiResponse<S63Permit>> registerPermit(
            @Valid @RequestBody PermitRequest request) {
        S63Permit permit = chartIntegrationService.registerPermit(
                request.getCellName(),
                request.getPermitKey(),
                request.getExpiryDate()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký giấy phép S-63 thành công", permit));
    }

    @DeleteMapping("/permits/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePermit(@PathVariable UUID id) {
        chartIntegrationService.deletePermit(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa giấy phép S-63 thành công", null));
    }

    // ========================================================================
    // Coordinate Calibration Endpoint
    // ========================================================================

    @PostMapping("/calibrate")
    public ResponseEntity<ApiResponse<CoordinateCalibrationService.CoordinateResult>> calibrate(
            @Valid @RequestBody CalibrationRequest request) {
        CoordinateCalibrationService.CoordinateResult result = coordinateCalibrationService.calibrate(
                request.getSystemType(),
                request.getCoord1(),
                request.getCoord2(),
                request.getZoneOrCm(),
                request.getDx(),
                request.getDy()
        );
        if (!result.valid) {
            return ResponseEntity.badRequest().body(ApiResponse.error(result.errorMessage));
        }
        return ResponseEntity.ok(ApiResponse.success("Hiệu chỉnh tọa độ thành công", result));
    }

    // ========================================================================
    // Request DTOs
    // ========================================================================

    @Data
    public static class PermitRequest {
        @NotBlank(message = "Tên cell không được để trống")
        private String cellName;

        @NotBlank(message = "Khóa permit không được để trống")
        private String permitKey;

        @NotBlank(message = "Ngày hết hạn không được để trống")
        private String expiryDate; // e.g. "2026-12-31"
    }

    @Data
    public static class CalibrationRequest {
        @NotBlank(message = "Hệ tọa độ không được để trống")
        private String systemType; // WGS84, VN2000, UTM

        @NotBlank(message = "Tọa độ 1 không được để trống")
        private String coord1; // Lon / Easting

        @NotBlank(message = "Tọa độ 2 không được để trống")
        private String coord2; // Lat / Northing

        private String zoneOrCm; // Zone for UTM (48N), Central Meridian for VN2000 (105.0)

        private double dx = 0.0;
        private double dy = 0.0;
    }
}
