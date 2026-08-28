package com.hanghai.kchtg.common.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.CommonOptionsService;
import com.hanghai.kchtg.mapicon.dto.MapSymbolOptionResponse;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import com.hanghai.kchtg.radarstation.dto.RadarStationOptionResponse;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Shared authenticated reference-data endpoints for selectors and filters. */
@RestController
@RequestMapping("/api/common/options")
public class CommonOptionsController {

    private final CommonOptionsService service;

    public CommonOptionsController(CommonOptionsService service) {
        this.service = service;
    }

    @GetMapping("/org-units")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<OrgUnitResponse>>> getOrgUnitOptions() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách đơn vị theo phạm vi phân quyền", service.getOrgUnitOptions()));
    }

    @GetMapping("/ports")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PortOptionResponse>>> getPortOptions(
            @RequestParam(required = false) ApprovalStatus approvalStatus) {
        return ResponseEntity.ok(ApiResponse.success("Danh sách cảng biển theo phạm vi phân quyền",
                service.getPortOptions(approvalStatus)));
    }

    @GetMapping("/operating-organizations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<com.hanghai.kchtg.common.dto.OperatingOrganizationOptionResponse>>> getOperatingOrganizationOptions(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success("Danh sách đơn vị vận hành và khai thác", service.getOperatingOrganizationOptions(keyword)));
    }

    @GetMapping("/operating-units")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<com.hanghai.kchtg.common.dto.OperatingOrganizationOptionResponse>>> getOperatingUnitOptions(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success("Danh sách đơn vị khai thác", service.getOperatingUnitOptions(keyword)));
    }

    @GetMapping("/symbols")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MapSymbolOptionResponse>>> getSymbolOptions() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách ký hiệu bản đồ", service.getSymbolOptions()));
    }

    @GetMapping("/radar-stations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<RadarStationOptionResponse>>> getRadarStationOptions() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách trạm radar", service.getRadarStationOptions()));
    }

    @GetMapping("/vts-operation-centers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<VtsOperationCenterOptionResponse>>> getVtsOperationCenterOptions() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách trung tâm điều hành VTS", service.getVtsOperationCenterOptions()));
    }
}
