package com.hanghai.kchtg.common.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.service.CommonOptionsService;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public ResponseEntity<ApiResponse<List<PortOptionResponse>>> getPortOptions() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách cảng biển theo phạm vi phân quyền", service.getPortOptions()));
    }
}
