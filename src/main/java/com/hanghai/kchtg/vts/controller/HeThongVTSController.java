package com.hanghai.kchtg.vts.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vts.dto.*;
import com.hanghai.kchtg.vts.service.HeThongVTSDataService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/he-thong-vts")
public class HeThongVTSController {

    private final HeThongVTSDataService service;

    public HeThongVTSController(HeThongVTSDataService service) {
        this.service = service;
    }

    @PreAuthorize("@auth.check(authentication, 'vts:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<HeThongVTSResponse>> create(
            @Valid @RequestBody HeThongVTSCreateRequest request,
            Authentication authentication) {
        try {
            HeThongVTSResponse response = service.create(request, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<HeThongVTSResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<HeThongVTSResponse> responses = service.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success("Danh sách hệ thống VTS", responses));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HeThongVTSResponse>> getById(
            @PathVariable Long id,
            Authentication authentication) {
        HeThongVTSResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HeThongVTSResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody HeThongVTSUpdateRequest request,
            Authentication authentication) {
        try {
            HeThongVTSResponse response = service.update(id, request, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            service.delete(id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<HeThongVTSResponse>> approveC1(
            @PathVariable Long id,
            @Valid @RequestBody PheDuyetRequest request,
            Authentication authentication) {
        try {
            HeThongVTSResponse response = service.approveC1(id, request, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<HeThongVTSResponse>> approveC2(
            @PathVariable Long id,
            @Valid @RequestBody PheDuyetRequest request,
            Authentication authentication) {
        try {
            HeThongVTSResponse response = service.approveC2(id, request, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'vts:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<HeThongVTSResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tinhTrang,
            @RequestParam(required = false) String trangThai) {
        List<HeThongVTSResponse> responses = service.search(keyword, tinhTrang, trangThai);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
    }

    @PreAuthorize("@auth.check(authentication, 'vts:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable Long id) {
        List<HistoryEntry> entries = service.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử thành công", entries));
    }
}
