package com.hanghai.kchtg.gis.search.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchResult;
import com.hanghai.kchtg.gis.search.dto.KchtType;
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
    public ResponseEntity<ApiResponse<Page<KchtGisSearchResult>>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) List<KchtType> kchtType,
            @RequestParam(required = false) TinhThanhPho tinhThanhPho,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) GisObjectType objectType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<KchtGisSearchResult> result = kchtGis155Service.search(
                orgUnitId, kchtType, tinhThanhPho, search, objectType, page, size);

        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm kết cấu hạ tầng thành công", result));
    }
}
