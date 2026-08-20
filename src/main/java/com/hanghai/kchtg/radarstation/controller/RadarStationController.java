package com.hanghai.kchtg.radarstation.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/radar-station")
@RequiredArgsConstructor
@Slf4j
public class RadarStationController {

    private final RadarStationService service;

    @PreAuthorize("@auth.check(authentication, 'radarstation:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<RadarStationResponse>> create(@Valid @RequestBody RadarStationCreateRequest request, Authentication authentication) {
        try {
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            RadarStationResponse response = service.create(request, userId);
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

    /**
     * Danh sách phân trang mở rộng cho màn danh sách F-068.
     * Lọc theo keyword, đơn vị quản lý, cảng biển, hệ thống VTS, trung tâm điều hành VTS,
     * đơn vị khai thác, tỉnh/thành phố, tình trạng, trạng thái phê duyệt,
     * cán bộ cập nhật (updatedBy), ngày cập nhật từ/đến (updatedFrom/updatedTo).
     */
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
                    operatingUnitId, provinceId, conditionStatus, approvalStatus,
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
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            RadarStationResponse response = service.update(id, request, userId);
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
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            service.delete(id, userId);
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<RadarStationResponse>> approveC1(@PathVariable UUID id,
                                       @Valid @RequestBody ApprovalRequest request,
                                       Authentication authentication) {
        try {
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            RadarStationResponse response = service.approveC1(id, request, userId);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt cấp 1 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<RadarStationResponse>> approveC2(@PathVariable UUID id,
                                       @Valid @RequestBody ApprovalRequest request,
                                       Authentication authentication) {
        try {
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            RadarStationResponse response = service.approveC2(id, request, userId);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt cấp 2 trạm radar id {}: {}", id, e.getMessage());
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

    /**
     * List records sitting at a given approval status. Mirrors the endpoint the other
     * infrastructure modules expose, which the frontend already calls.
     */
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
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            List<RadarStationAttachmentResponse> responses = service.uploadAttachments(id, files, userId);
            return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tải lên file đính kèm trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<RadarStationAttachmentResponse>>> listAttachments(@PathVariable UUID id) {
        try {
            List<RadarStationAttachmentResponse> responses = service.listAttachments(id);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy danh sách file đính kèm trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:update')")
    @DeleteMapping("/{id}/attachments/{attId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        try {
            java.util.UUID userId = authentication != null && authentication.getPrincipal() instanceof User ? ((User) authentication.getPrincipal()).getId() : null;
            service.deleteAttachment(id, attId, userId);
            return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa file đính kèm trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Chuyển chuỗi ngày giờ từ request sang LocalDateTime (ISO).
     * Rỗng/null -> null; khoảng trắng thay bằng 'T' theo pattern chuẩn của beacon/PortService.
     */
    private LocalDateTime parseLocalDateTime(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.trim().replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }
}
