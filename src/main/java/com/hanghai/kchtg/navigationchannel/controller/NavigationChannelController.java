package com.hanghai.kchtg.navigationchannel.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for NavigationChannel (F-038 to F-043) complying with M-1006.
 */
@RestController
@RequestMapping("/api/v1/navigation-channel")
@RequiredArgsConstructor
@Slf4j
public class NavigationChannelController {

    private final NavigationChannelService service;

    private UUID getUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        return null;
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = service.generateChannelCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã luồng hàng hải thành công", Map.of("code", code)));
    }

    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<NavigationChannelOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        try {
            List<NavigationChannelOptionResponse> options = service.getOptions(orgUnitId);
            return ResponseEntity.ok(ApiResponse.success("Danh sách lựa chọn luồng hàng hải", options));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy options luồng hàng hải: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    @GetMapping("/tab-counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTabCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        try {
            Map<String, Long> counts = service.getTabCounts(orgUnitId, keyword, status);
            return ResponseEntity.ok(ApiResponse.success("Thống kê số lượng luồng hàng hải theo trạng thái", counts));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy tab counts luồng hàng hải: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> create(
            @RequestBody @Valid NavigationChannelCreateRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.success("Tạo luồng hàng hải thành công", service.create(req, getUserId(authentication))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<NavigationChannelResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search-paged")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<Page<NavigationChannelResponse>>> searchPaged(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID seaportId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortOrder) {
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortOrder), sortBy);
            PageRequest pageable = PageRequest.of(page, size, sort);
            ApprovalStatus statusEnum = approvalStatus != null && !approvalStatus.trim().isEmpty()
                    ? ApprovalStatus.fromString(approvalStatus)
                    : null;
            Page<NavigationChannelResponse> responses = service.searchPaged(
                    orgUnitId, keyword, seaportId, status,
                    statusEnum, updatedBy, parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo), pageable);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm luồng hàng hải thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm phân trang luồng hàng hải: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:update')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid NavigationChannelUpdateRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật luồng hàng hải thành công",
                service.update(id, req, getUserId(authentication))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, Authentication authentication) {
        service.delete(id, getUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Xóa luồng hàng hải thành công", null));
    }

    @PostMapping(value = { "/{id}/submit", "/{id}/submit-approval" })
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create') or @auth.check(authentication, 'navigationchannel:update')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> submitForApproval(@PathVariable UUID id,
            Authentication authentication) {
        try {
            NavigationChannelResponse response = service.submitForApproval(id, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Đã gửi phê duyệt luồng hàng hải", response));
        } catch (Exception e) {
            log.warn("Lỗi khi gửi phê duyệt luồng hàng hải id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = { "/{id}/approvec1", "/{id}/approve/c1" })
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> approveC1(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String n = note != null ? note : (req != null ? req.getReason() : null);
            NavigationChannelResponse response = service.approveLevel1(id, getUserId(authentication), n);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt C1 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C1 luồng hàng hải id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = { "/{id}/approvec2", "/{id}/approve/c2" })
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> approveC2(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String n = note != null ? note : (req != null ? req.getReason() : null);
            NavigationChannelResponse response = service.approveLevel2(id, getUserId(authentication), n);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt C2 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C2 luồng hàng hải id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = { "/{id}/rejectc1", "/{id}/reject/c1" })
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> rejectC1(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String r = reason != null ? reason : (req != null ? req.getReason() : null);
            NavigationChannelResponse response = service.rejectLevel1(id, getUserId(authentication), r);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối C1 luồng hàng hải", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C1 luồng hàng hải id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = { "/{id}/rejectc2", "/{id}/reject/c2" })
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> rejectC2(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String r = reason != null ? reason : (req != null ? req.getReason() : null);
            NavigationChannelResponse response = service.rejectLevel2(id, getUserId(authentication), r);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối C2 luồng hàng hải", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C2 luồng hàng hải id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getHistory(id)));
    }

    private LocalDateTime parseLocalDateTime(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty())
            return null;
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateStr + "T00:00:00");
            } catch (Exception e2) {
                return null;
            }
        }
    }
}
