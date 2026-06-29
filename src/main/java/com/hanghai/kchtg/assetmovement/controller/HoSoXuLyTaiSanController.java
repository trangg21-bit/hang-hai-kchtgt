package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiXuLy;
import com.hanghai.kchtg.assetmovement.service.HoSoXuLyTaiSanService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller cho Ho So Xu Ly Tai San (F-124).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/ho-so-xu-ly")
@RequiredArgsConstructor
public class HoSoXuLyTaiSanController {

    private final HoSoXuLyTaiSanService hoSoService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:ho-so-xu-ly')")
    public ResponseEntity<ApiResponse<HoSoXuLyTaiSanResponse>> create(
            @RequestBody HoSoXuLyTaiSanRequest request) {
        HoSoXuLyTaiSanResponse response = hoSoService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Ho so da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:ho-so-xu-ly')")
    public ResponseEntity<ApiResponse<HoSoXuLyTaiSanResponse>> getById(
            @PathVariable UUID id) {
        HoSoXuLyTaiSanResponse response = hoSoService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:ho-so-xu-ly')")
    public ResponseEntity<ApiResponse<Page<HoSoXuLyTaiSanResponse>>> findAll(
            @RequestParam(required = false) UUID taiSanId,
            @RequestParam(required = false) LoaiXuLy loaiXuLy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<HoSoXuLyTaiSanResponse> result;
        if (taiSanId != null && loaiXuLy != null) {
            result = hoSoService.findByTaiSanIdAndLoaiXuLy(taiSanId, loaiXuLy, pageable);
        } else if (loaiXuLy != null) {
            result = hoSoService.findByLoaiXuLy(loaiXuLy, pageable);
        } else if (taiSanId != null) {
            result = hoSoService.findByTaiSanId(taiSanId, pageable);
        } else {
            result = hoSoService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:ho-so-xu-ly')")
    public ResponseEntity<ApiResponse<HoSoXuLyTaiSanResponse>> update(
            @PathVariable UUID id,
            @RequestBody HoSoXuLyTaiSanRequest request) {
        HoSoXuLyTaiSanResponse response = hoSoService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Ho so da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:ho-so-xu-ly')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        hoSoService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Ho so da duoc xoa", null));
    }
}
