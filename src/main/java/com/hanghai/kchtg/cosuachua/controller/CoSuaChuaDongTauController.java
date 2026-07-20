package com.hanghai.kchtg.cosuachua.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cosuachua.dto.*;
import com.hanghai.kchtg.cosuachua.service.CoSuaChuaDongTauService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/co-so-sua-chua")
@RequiredArgsConstructor
@Slf4j
public class CoSuaChuaDongTauController {

    private final CoSuaChuaDongTauService service;

    @PreAuthorize("@auth.check(authentication, 'cosuachua:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<CoSuaChuaDongTauResponse>> create(
            @Valid @RequestBody CoSuaChuaDongTauCreateRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.create(request, username);
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi tạo cơ sở sửa chữa, đóng tàu: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CoSuaChuaDongTauResponse>> getById(@PathVariable java.util.UUID id) {
        try {
            CoSuaChuaDongTauResponse response = service.getById(id);
            return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy cơ sở sửa chữa, đóng tàu theo id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CoSuaChuaDongTauResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<CoSuaChuaDongTauResponse> responses = service.findAll(page, size);
            return ResponseEntity.ok(ApiResponse.success("Danh sách cơ sở sửa chữa, đóng tàu", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm tất cả cơ sở sửa chữa, đóng tàu: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CoSuaChuaDongTauResponse>> update(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody CoSuaChuaDongTauUpdateRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.update(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable java.util.UUID id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            service.delete(id, username);
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<CoSuaChuaDongTauResponse>> approveC1(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody PheDuyetRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.approveC1(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C1 cho cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<CoSuaChuaDongTauResponse>> approveC2(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody PheDuyetRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            CoSuaChuaDongTauResponse response = service.approveC2(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C2 cho cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable java.util.UUID id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", history));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy lịch sử cho cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'cosuachua:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CoSuaChuaDongTauResponse>>> search(
            @RequestParam(required = false) java.util.UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tinhThanh,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String trangThaiPheDuyet) {
        try {
            List<CoSuaChuaDongTauResponse> responses = service.search(orgUnitId, keyword, tinhThanh, trangThai, trangThaiPheDuyet);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm cơ sở sửa chữa, đóng tàu: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
