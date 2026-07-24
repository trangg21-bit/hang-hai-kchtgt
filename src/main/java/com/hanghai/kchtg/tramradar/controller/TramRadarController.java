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
            log.warn("Lỗi khi tạo trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TramRadarResponse>> getById(@PathVariable java.util.UUID id) {
        try {
            TramRadarResponse response = service.getById(id);
            return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy trạm radar theo id {}: {}", id, e.getMessage());
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
            log.warn("Lỗi khi tìm kiếm tất cả trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TramRadarResponse>> update(@PathVariable java.util.UUID id,
                                    @Valid @RequestBody TramRadarUpdateRequest request,
                                    Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.update(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable java.util.UUID id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            service.delete(id, username);
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<TramRadarResponse>> approveC1(@PathVariable java.util.UUID id,
                                       @Valid @RequestBody ApprovalRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.approveC1(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt cấp 1 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<TramRadarResponse>> approveC2(@PathVariable java.util.UUID id,
                                       @Valid @RequestBody ApprovalRequest request,
                                       Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            TramRadarResponse response = service.approveC2(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt cấp 2 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable java.util.UUID id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", history));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy lịch sử trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'tramradar:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TramRadarResponse>>> search(
            @RequestParam(required = false) java.util.UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tinhTrang,
            @RequestParam(required = false) String trangThai) {
        try {
            List<TramRadarResponse> responses = service.search(orgUnitId, keyword, tinhTrang, trangThai);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
