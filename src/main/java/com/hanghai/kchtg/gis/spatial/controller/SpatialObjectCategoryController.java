package com.hanghai.kchtg.gis.spatial.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.spatial.dto.SpatialObjectCategoryDto;
import com.hanghai.kchtg.gis.spatial.service.SpatialObjectCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/gis/spatial-categories")
@RequiredArgsConstructor
public class SpatialObjectCategoryController {

    private final SpatialObjectCategoryService service;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'gispoint:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'gispolygon:read') or @auth.check(authentication, 'data:read') or hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN')")
    public ApiResponse<Page<SpatialObjectCategoryDto>> getAll(
            @RequestParam(required = false) Integer geometryType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Boolean isDeleted,
            @RequestParam(required = false) UUID iconId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromUpdatedDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toUpdatedDate,
            Pageable pageable) {
        Page<SpatialObjectCategoryDto> page = service.findAll(
                geometryType, status, isDeleted, iconId, code, name, search, fromUpdatedDate, toUpdatedDate, pageable);
        return ApiResponse.success(page);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'gispoint:read') or @auth.check(authentication, 'gisline:read') or @auth.check(authentication, 'gispolygon:read') or @auth.check(authentication, 'data:read') or hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN')")
    public ApiResponse<SpatialObjectCategoryDto> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'gispoint:create') or @auth.check(authentication, 'gisline:create') or @auth.check(authentication, 'gispolygon:create') or @auth.check(authentication, 'data:create') or hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN')")
    public ApiResponse<SpatialObjectCategoryDto> create(@RequestBody SpatialObjectCategoryDto request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'gispoint:update') or @auth.check(authentication, 'gisline:update') or @auth.check(authentication, 'gispolygon:update') or @auth.check(authentication, 'data:update') or hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN')")
    public ApiResponse<SpatialObjectCategoryDto> update(@PathVariable UUID id, @RequestBody SpatialObjectCategoryDto request) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'gispoint:delete') or @auth.check(authentication, 'gisline:delete') or @auth.check(authentication, 'gispolygon:delete') or @auth.check(authentication, 'data:delete') or hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
