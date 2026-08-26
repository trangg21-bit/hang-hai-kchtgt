package com.hanghai.kchtg.radarstation.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.radarstation.service.RadarStationService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/radar-station")
@RequiredArgsConstructor
@Slf4j
public class RadarStationController {

    private final RadarStationService service;

    private UUID getUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        return null;
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<RadarStationResponse>> create(@Valid @RequestBody RadarStationCreateRequest request, Authentication authentication) {
        try {
            RadarStationResponse response = service.create(request, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi tạo trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:create')")
    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        try {
            String code = service.generateCode();
            return ResponseEntity.ok(ApiResponse.success("Sinh mã trạm radar thành công", Map.of("code", code)));
        } catch (Exception e) {
            log.warn("Lỗi khi sinh mã trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<RadarStationOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        try {
            List<RadarStationOptionResponse> options = service.getOptions(orgUnitId);
            return ResponseEntity.ok(ApiResponse.success("Danh sách lựa chọn trạm radar", options));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy options trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/tab-counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTabCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus) {
        try {
            Map<String, Long> counts = service.getTabCounts(orgUnitId, keyword, conditionStatus);
            return ResponseEntity.ok(ApiResponse.success("Thống kê số lượng theo trạng thái", counts));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy tab counts trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RadarStationResponse>> getById(@PathVariable UUID id) {
        try {
            RadarStationResponse response = service.getById(id);
            return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy trạm radar theo id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RadarStationResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<RadarStationResponse> responses = service.findAll(page, size);
            return ResponseEntity.ok(ApiResponse.success("Danh sách trạm radar", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm tất cả trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/search-paged")
    public ResponseEntity<ApiResponse<Page<RadarStationResponse>>> searchPaged(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID seaportId,
            @RequestParam(required = false) UUID vtsSystemId,
            @RequestParam(required = false) UUID vtsOperationCenterId,
            @RequestParam(required = false) UUID operatingUnitId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String status,
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
            Page<RadarStationResponse> responses = service.searchPaged(
                    keyword, orgUnitId, seaportId, vtsSystemId, vtsOperationCenterId,
                    operatingUnitId, provinceId, conditionStatus, approvalStatus, status,
                    updatedBy, parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo), pageable);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm trạm radar thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm phân trang trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RadarStationResponse>> update(@PathVariable UUID id,
                                    @Valid @RequestBody RadarStationUpdateRequest request,
                                    Authentication authentication) {
        try {
            RadarStationResponse response = service.update(id, request, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, Authentication authentication) {
        try {
            service.delete(id, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:create') or @auth.check(authentication, 'radarstation:update')")
    @PostMapping(value = {"/{id}/submit", "/{id}/submit-approval"})
    public ResponseEntity<ApiResponse<RadarStationResponse>> submitForApproval(@PathVariable UUID id, Authentication authentication) {
        try {
            RadarStationResponse response = service.submitForApproval(id, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Đã gửi phê duyệt", response));
        } catch (Exception e) {
            log.warn("Lỗi khi gửi phê duyệt trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:approvec1')")
    @PostMapping(value = {"/{id}/approvec1", "/{id}/approve-l1"})
    public ResponseEntity<ApiResponse<RadarStationResponse>> approveLevel1(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.approveLevel1(id, getUserId(authentication), note);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi phê duyệt C1 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:approvec2')")
    @PostMapping("/{id}/approvec2")
    public ResponseEntity<ApiResponse<RadarStationResponse>> approveLevel2(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.approveLevel2(id, getUserId(authentication), note);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi phê duyệt C2 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:approvec1')")
    @PostMapping(value = {"/{id}/rejectc1", "/{id}/reject"})
    public ResponseEntity<ApiResponse<RadarStationResponse>> rejectLevel1(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String rejectReason,
            Authentication authentication) {
        try {
            String r = reason != null && !reason.isBlank() ? reason : rejectReason;
            RadarStationResponse response = service.rejectLevel1(id, getUserId(authentication), r);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối cấp 1", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C1 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:approvec2')")
    @PostMapping("/{id}/rejectc2")
    public ResponseEntity<ApiResponse<RadarStationResponse>> rejectLevel2(
            @PathVariable UUID id,
            @RequestParam String reason,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.rejectLevel2(id, getUserId(authentication), reason);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối cấp 2", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C2 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable UUID id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", history));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy lịch sử trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/approval-status/{status}")
    public ResponseEntity<ApiResponse<List<RadarStationResponse>>> filterByApprovalStatus(
            @PathVariable String status) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    service.findByApprovalStatus(ApprovalStatus.valueOf(status))));
        } catch (Exception e) {
            log.warn("Lỗi khi lọc trạm radar theo trạng thái phê duyệt: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<RadarStationResponse>>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) String approvalStatus) {
        try {
            List<RadarStationResponse> responses = service.search(orgUnitId, keyword, conditionStatus, approvalStatus);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── Attachment endpoints (InfrastructureAttachment, ref_type RADAR_STATION) ──

    @PreAuthorize("@auth.check(authentication, 'radarstation:update')")
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<RadarStationAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        try {
            if (files == null || files.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Không có file nào được chọn để tải lên"));
            }
            List<RadarStationAttachmentResponse> responses = service.uploadAttachments(id, files, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Tải lên tệp đính kèm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tải lên attachment trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<RadarStationAttachmentResponse>>> listAttachments(@PathVariable UUID id) {
        try {
            List<RadarStationAttachmentResponse> attachments = service.listAttachments(id);
            return ResponseEntity.ok(ApiResponse.success("Danh sách file đính kèm thành công", attachments));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy danh sách attachments trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:delete')")
    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId,
            Authentication authentication) {
        try {
            service.deleteAttachment(id, attachmentId, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa attachment {} của trạm radar id {}: {}", attachmentId, id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
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
