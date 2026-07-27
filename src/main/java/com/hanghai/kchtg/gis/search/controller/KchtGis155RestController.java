package com.hanghai.kchtg.gis.search.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchResult;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.search.dto.TinhThanhPho;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.gis.search.service.KchtGis155Service;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kchtgis/kchtgis_155")
@RequiredArgsConstructor
public class KchtGis155RestController {

    private final KchtGis155Service kchtGis155Service;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<KchtGisSearchResult>>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) List<InfrastructureType> infrastructureType,
            @RequestParam(required = false) String tinhThanhPho,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) GisObjectType objectType) {

        TinhThanhPho mappedEnum = TinhThanhPho.fromString(tinhThanhPho);
        List<KchtGisSearchResult> result = kchtGis155Service.search(
                orgUnitId, infrastructureType, mappedEnum, search, objectType);

        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm kết cấu hạ tầng thành công", result));
    }
}
