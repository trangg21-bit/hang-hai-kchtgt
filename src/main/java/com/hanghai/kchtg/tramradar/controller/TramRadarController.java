package com.hanghai.kchtg.tramradar.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.service.TramRadarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tram-radar")
@RequiredArgsConstructor
@Slf4j
public class TramRadarController {

    private final TramRadarService service;

    @PreAuthorize("@auth.check(authentication, 'tramradar:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<TramRadarResponse>> create(@Valid @RequestBody TramRadarCreateRequest request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.create(request, username);
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            log.error("Error creating TramRadar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TramRadarResponse>> getById(@PathVariable Long id) {
        try {
            TramRadarResponse response = service.getById(id);
            return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
        } catch (Exception e) {
            log.error("Error getting TramRadar by id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TramRadarResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<TramRadarResponse> responses = service.findAll(page, size);
            return ResponseEntity.ok(ApiResponse.success("Danh sách trạm radar", responses));
        } catch (Exception e) {
            log.error("Error finding all TramRadar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TramRadarResponse>> update(@PathVariable Long id,
                                    @Valid @RequestBody TramRadarUpdateRequest request,
                                    Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.update(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            log.error("Error updating TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            service.delete(id, username);
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            log.error("Error deleting TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<TramRadarResponse>> approveC1(@PathVariable Long id,
                                       @Valid @RequestBody PheDuyetRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.approveC1(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            log.error("Error approving C1 for TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<TramRadarResponse>> approveC2(@PathVariable Long id,
                                       @Valid @RequestBody PheDuyetRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.approveC2(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            log.error("Error approving C2 for TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable Long id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(ApiResponse.success("Lịch sử thành công", history));
        } catch (Exception e) {
            log.error("Error getting history for TramRadar id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TramRadarResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tinhTrang,
            @RequestParam(required = false) String trangThai) {
        try {
            List<TramRadarResponse> responses = service.search(keyword, tinhTrang, trangThai);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
        } catch (Exception e) {
            log.error("Error searching TramRadar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
