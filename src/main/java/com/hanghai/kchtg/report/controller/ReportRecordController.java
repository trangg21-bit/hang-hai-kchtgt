package com.hanghai.kchtg.report.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.dto.ReportRecordDto;
import com.hanghai.kchtg.report.service.ReportRecordService;
import com.hanghai.kchtg.security.annotation.DataScope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller cho CRUD bản ghi snapshot báo cáo nhập/lưu (BCPTTV, BCDN, BCTT48...).
 */
@RestController
@RequestMapping("/api/v1/report-records")
@RequiredArgsConstructor
@Slf4j
@DataScope
public class ReportRecordController {

    private final ReportRecordService reportRecordService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<List<ReportRecordDto>>> search(
            @RequestParam(required = false) String reportCode,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) Integer reportYear,
            @RequestParam(required = false) String reportPeriod) {
        List<ReportRecordDto> list = reportRecordService.search(reportCode, orgUnitId, reportYear, reportPeriod);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<ReportRecordDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(reportRecordService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'report:create')")
    public ResponseEntity<ApiResponse<ReportRecordDto>> save(@RequestBody ReportRecordDto dto) {
        ReportRecordDto saved = reportRecordService.save(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lưu dữ liệu báo cáo thành công", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'report:update')")
    public ResponseEntity<ApiResponse<ReportRecordDto>> update(
            @PathVariable UUID id,
            @RequestBody ReportRecordDto dto) {
        dto.setId(id);
        ReportRecordDto updated = reportRecordService.save(dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật dữ liệu báo cáo thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'report:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        reportRecordService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa dữ liệu báo cáo thành công", null));
    }
}
