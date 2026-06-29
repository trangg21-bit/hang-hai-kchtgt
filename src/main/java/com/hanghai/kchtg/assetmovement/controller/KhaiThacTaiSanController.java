package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanResponse;
import com.hanghai.kchtg.assetmovement.service.KhaiThacTaiSanService;
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
 * REST Controller cho Khai Thac Tai San (F-126).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/khai-thac")
@RequiredArgsConstructor
public class KhaiThacTaiSanController {

    private final KhaiThacTaiSanService khaiThacService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:khai-thac')")
    public ResponseEntity<ApiResponse<KhaiThacTaiSanResponse>> create(
            @RequestBody KhaiThacTaiSanRequest request) {
        KhaiThacTaiSanResponse response = khaiThacService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Khai thac da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:khai-thac')")
    public ResponseEntity<ApiResponse<KhaiThacTaiSanResponse>> getById(
            @PathVariable UUID id) {
        KhaiThacTaiSanResponse response = khaiThacService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:khai-thac')")
    public ResponseEntity<ApiResponse<Page<KhaiThacTaiSanResponse>>> findAll(
            @RequestParam(required = false) UUID taiSanId,
            @RequestParam(required = false) Integer namKhaiThac,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<KhaiThacTaiSanResponse> result;
        if (taiSanId != null && namKhaiThac != null) {
            result = khaiThacService.findByTaiSanIdAndNamKhaiThac(taiSanId, namKhaiThac, pageable);
        } else if (namKhaiThac != null) {
            result = khaiThacService.findByNamKhaiThac(namKhaiThac, pageable);
        } else if (taiSanId != null) {
            result = khaiThacService.findByTaiSanId(taiSanId, pageable);
        } else {
            result = khaiThacService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:khai-thac')")
    public ResponseEntity<ApiResponse<KhaiThacTaiSanResponse>> update(
            @PathVariable UUID id,
            @RequestBody KhaiThacTaiSanRequest request) {
        KhaiThacTaiSanResponse response = khaiThacService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Khai thac da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:khai-thac')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        khaiThacService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Khai thac da duoc xoa", null));
    }
}
