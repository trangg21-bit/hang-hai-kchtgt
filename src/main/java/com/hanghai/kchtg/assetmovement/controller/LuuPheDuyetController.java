package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetRequest;
import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetResponse;
import com.hanghai.kchtg.assetmovement.entity.KetQuaPheDuyet;
import com.hanghai.kchtg.assetmovement.service.LuuPheDuyetService;
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
 * REST Controller cho Luu Phe Duyet (F-127).
 * Pattern tu TaiHistoryController (M-015).
 */
@RestController
@RequestMapping("/api/v1/asset/luu-phe-duyet")
@RequiredArgsConstructor
public class LuuPheDuyetController {

    private final LuuPheDuyetService luuPheService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'asset:luu-phe-duyet')")
    public ResponseEntity<ApiResponse<LuuPheDuyetResponse>> create(
            @RequestBody LuuPheDuyetRequest request) {
        LuuPheDuyetResponse response = luuPheService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Luu phe duyet da duoc tao", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:luu-phe-duyet')")
    public ResponseEntity<ApiResponse<LuuPheDuyetResponse>> getById(
            @PathVariable UUID id) {
        LuuPheDuyetResponse response = luuPheService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'asset:luu-phe-duyet')")
    public ResponseEntity<ApiResponse<Page<LuuPheDuyetResponse>>> findAll(
            @RequestParam(required = false) UUID yeuCauId,
            @RequestParam(required = false) KetQuaPheDuyet ketQua,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<LuuPheDuyetResponse> result;
        if (yeuCauId != null && ketQua != null) {
            result = luuPheService.findByYeuCauIdAndKetQua(yeuCauId, ketQua, pageable);
        } else if (ketQua != null) {
            result = luuPheService.findByKetQua(ketQua, pageable);
        } else if (yeuCauId != null) {
            result = luuPheService.findByYeuCauId(yeuCauId, pageable);
        } else {
            result = luuPheService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:luu-phe-duyet')")
    public ResponseEntity<ApiResponse<LuuPheDuyetResponse>> update(
            @PathVariable UUID id,
            @RequestBody LuuPheDuyetRequest request) {
        LuuPheDuyetResponse response = luuPheService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Luu phe duyet da duoc cap nhat", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'asset:luu-phe-duyet')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        luuPheService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Luu phe duyet da duoc xoa", null));
    }
}
