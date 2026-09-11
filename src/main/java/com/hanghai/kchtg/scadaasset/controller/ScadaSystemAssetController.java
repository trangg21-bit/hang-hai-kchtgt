package com.hanghai.kchtg.scadaasset.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.scada.dto.ScadaOptionResponse;
import com.hanghai.kchtg.scada.service.ScadaService;
import com.hanghai.kchtg.scadaasset.dto.ScadaSystemAssetRequest;
import com.hanghai.kchtg.scadaasset.dto.ScadaSystemAssetResponse;
import com.hanghai.kchtg.scadaasset.service.ScadaSystemAssetService;
import com.hanghai.kchtg.security.annotation.DataScope;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/asset/scada-assets")
@RequiredArgsConstructor
@DataScope
public class ScadaSystemAssetController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "assetCode", "assetName", "parentOrgUnitId", "orgUnitId", "usingOrgUnitId",
            "scadaId", "assetType", "barcode", "assetCondition", "usageStatus",
            "assetGroup", "origin", "quantity", "model", "serialNumber",
            "constructionYear", "useDate", "originalValue", "remainingValue",
            "createdAt", "updatedAt", "approvalStatus", "status",
            "updatedBy", "submittedBy", "submittedAt", "portAuthorityApprovedBy",
            "portAuthorityApprovedAt", "portAuthorityApprovalContent",
            "departmentApprovedBy", "departmentApprovedAt", "departmentApprovalContent"
    );

    private static Sort resolveSort(String sortBy, String sortDir) {
        if (sortBy == null || sortBy.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "updatedAt");
        }
        String field = sortBy.trim();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            return Sort.by(Sort.Direction.DESC, "updatedAt");
        }
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }

    private final ScadaSystemAssetService service;
    private final ScadaService scadaService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<ScadaSystemAssetResponse>> create(
            @RequestBody ScadaSystemAssetRequest request) {
        ScadaSystemAssetResponse response = service.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản hệ thống SCADA đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<ScadaSystemAssetResponse>> getById(
            @PathVariable UUID id) {
        ScadaSystemAssetResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Page<ScadaSystemAssetResponse>>> findAll(
            @RequestParam(required = false) String assetCode,
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) UUID parentOrgUnitId,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID usingOrgUnitId,
            @RequestParam(required = false) UUID scadaId,
            @RequestParam(required = false) String assetType,
            @RequestParam(required = false) String assetCondition,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) LocalDate updatedFrom,
            @RequestParam(required = false) LocalDate updatedTo,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sortBy, sortDir));
        Page<ScadaSystemAssetResponse> result = service.findAll(
                assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId, scadaId,
                assetType, assetCondition, approvalStatus, updatedFrom, updatedTo, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<ScadaSystemAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody ScadaSystemAssetRequest request) {
        ScadaSystemAssetResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản hệ thống SCADA đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản hệ thống SCADA đã được xóa", null));
    }

    @GetMapping("/scada-options")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<List<ScadaOptionResponse>>> getScadaOptions() {
        return ResponseEntity.ok(ApiResponse.success(scadaService.getOptions()));
    }
}
