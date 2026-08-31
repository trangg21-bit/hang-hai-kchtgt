package com.hanghai.kchtg.dikerevetment.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
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
 * REST controller for DikeRevetment (F-044 to F-049) complying with M-1006.
 */
@RestController
@RequestMapping("/api/v1/dike-revetment")
@RequiredArgsConstructor
@Slf4j
public class DikeRevetmentController {

    private final DikeRevetmentService service;

    private UUID getUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        return null;
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = service.generateDikeRevetmentCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã đê kè thành công", Map.of("code", code)));
    }

    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<DikeRevetmentOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        try {
            List<DikeRevetmentOptionResponse> options = service.getOptions(orgUnitId);
            return ResponseEntity.ok(ApiResponse.success("Danh sách lựa chọn đê kè", options));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy options đê kè: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    @GetMapping("/tab-counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTabCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus) {
        try {
            Map<String, Long> counts = service.getTabCounts(orgUnitId, keyword, conditionStatus);
            return ResponseEntity.ok(ApiResponse.success("Thống kê số lượng đê kè theo trạng thái", counts));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy tab counts đê kè: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:create')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> create(
            @RequestBody @Valid DikeRevetmentCreateRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Tạo đê kè thành công", service.create(req, getUserId(authentication))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<List<DikeRevetmentResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search-paged")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<Page<DikeRevetmentResponse>>> searchPaged(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID seaportId,
            @RequestParam(required = false) DikeRevetmentType dikeRevetmentType,
            @RequestParam(required = false) String conditionStatus,
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
            Page<DikeRevetmentResponse> responses = service.searchPaged(
                    orgUnitId, keyword, seaportId, dikeRevetmentType, conditionStatus,
                    statusEnum, updatedBy, parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo), pageable);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm đê kè thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm phân trang đê kè: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:update')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid DikeRevetmentUpdateRequest req,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đê kè thành công", service.update(id, req, getUserId(authentication))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, Authentication authentication) {
        service.delete(id, getUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Xóa đê kè thành công", null));
    }

    @PostMapping(value = {"/{id}/submit", "/{id}/submit-approval"})
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:create') or @auth.check(authentication, 'dikerevetment:update')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> submitForApproval(@PathVariable UUID id, Authentication authentication) {
        try {
            DikeRevetmentResponse response = service.submitForApproval(id, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Đã gửi phê duyệt đê kè", response));
        } catch (Exception e) {
            log.warn("Lỗi khi gửi phê duyệt đê kè id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = {"/{id}/approvec1", "/{id}/approve/c1"})
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec1')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> approveC1(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String n = note != null ? note : (req != null ? req.getReason() : null);
            DikeRevetmentResponse response = service.approveLevel1(id, getUserId(authentication), n);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C1 đê kè id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = {"/{id}/approvec2", "/{id}/approve/c2"})
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec2')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> approveC2(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String n = note != null ? note : (req != null ? req.getReason() : null);
            DikeRevetmentResponse response = service.approveLevel2(id, getUserId(authentication), n);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C2 đê kè id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = {"/{id}/rejectc1", "/{id}/reject/c1"})
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec1')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> rejectC1(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String r = reason != null ? reason : (req != null ? req.getReason() : null);
            DikeRevetmentResponse response = service.rejectLevel1(id, getUserId(authentication), r);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối cấp Chi cục đê kè", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C1 đê kè id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = {"/{id}/rejectc2", "/{id}/reject/c2"})
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:approvec2')")
    public ResponseEntity<ApiResponse<DikeRevetmentResponse>> rejectC2(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestBody(required = false) ApprovalRequest req,
            Authentication authentication) {
        try {
            String r = reason != null ? reason : (req != null ? req.getReason() : null);
            DikeRevetmentResponse response = service.rejectLevel2(id, getUserId(authentication), r);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối cấp Cục đê kè", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C2 đê kè id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:history')")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getHistory(id)));
    }

    private LocalDateTime parseLocalDateTime(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
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
