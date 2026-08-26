package com.hanghai.kchtg.gis.search.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchPage;
import com.hanghai.kchtg.gis.search.service.KchtGis155Service;
import com.hanghai.kchtg.security.annotation.DataScope;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kchtgis/kchtgis_155")
@RequiredArgsConstructor
@DataScope
public class KchtGis155RestController {

    private final KchtGis155Service kchtGis155Service;

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<KchtGisSearchPage>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(name = "kchtType", required = false) List<InfrastructureType> kchtTypes,
            @RequestParam(name = "infrastructureType", required = false) List<InfrastructureType> legacyKchtTypes,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String province,
            @RequestParam(name = "tinhThanhPho", required = false) String legacyProvince,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) GisObjectType objectType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<InfrastructureType> resolvedTypes = kchtTypes != null ? kchtTypes : legacyKchtTypes;
        String resolvedProvince = province != null ? province : legacyProvince;
        KchtGisSearchPage result = kchtGis155Service.search(
                orgUnitId, resolvedTypes, provinceId, resolvedProvince, search, objectType, page, size);

        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm kết cấu hạ tầng thành công", result));
    }
}
