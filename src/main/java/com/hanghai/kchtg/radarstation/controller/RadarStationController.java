package com.hanghai.kchtg.radarstation.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import com.hanghai.kchtg.radarstation.service.RadarStationService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<RadarStationResponse>> create(
            @Valid @RequestBody RadarStationCreateRequest request, Authentication authentication) {
        try {
            RadarStationResponse response = service.create(request, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Lỗi khi tạo trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:create')")
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
            @RequestParam(required = false) String stationName,
            @RequestParam(required = false) String conditionStatus) {
        try {
            Map<String, Long> counts = service.getTabCounts(orgUnitId, keyword, stationName, conditionStatus);
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

    public static Sort resolveSort(String sortBy, String sortOrder) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortOrder) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "t.updatedAt")
                .and(JpaSort.unsafe(Sort.Direction.DESC, "t.createdAt"))
                .and(JpaSort.unsafe(Sort.Direction.ASC, "t.id"));
        if (sortBy == null || sortBy.isBlank()) {
            return defaultSort;
        }
        String field = sortBy.trim();
        String property;
        switch (field) {
            case "code":
                property = "LOWER(t.code)";
                break;
            case "stationName":
            case "name":
                property = "LOWER(t.stationName)";
                break;
            case "location":
                property = "LOWER(t.location)";
                break;
            case "stationType":
                property = "LOWER(t.stationType)";
                break;
            case "coverage":
                property = "t.coverage";
                break;
            case "emissionArea":
                property = "t.emissionArea";
                break;
            case "source":
                property = "t.source";
                break;
            case "unitOfMeasure":
                property = "t.unitOfMeasure";
                break;
            case "quantity":
                property = "t.quantity";
                break;
            case "conditionStatus":
                property = "t.conditionStatus";
                break;
            case "status":
            case "approvalStatus":
                property = "t.approvalStatus";
                break;
            case "orgUnitName":
            case "orgUnitId":
                property = "LOWER(o.name)";
                break;
            case "seaportName":
            case "seaportId":
                property = "LOWER(p.portName)";
                break;
            case "provinceName":
            case "provinceId":
                property = "LOWER(pv.name)";
                break;
            case "submittedByName":
            case "submittedForApprovalBy":
            case "submittedInfo":
                property = "t.submittedAt";
                break;
            case "approverLevel1Name":
            case "approvedByNameLevel1":
            case "approverLevel1":
            case "approvedLevel1Info":
                property = "t.approvedDateLevel1";
                break;
            case "approverLevel2Name":
            case "approvedByNameLevel2":
            case "approverLevel2":
            case "approvedLevel2Info":
                property = "t.approvedDateLevel2";
                break;
            case "updatedByName":
            case "updatedBy":
            case "updatedInfo":
            case "updatedAt":
                property = "t.updatedAt";
                break;
            case "createdAt":
                property = "t.createdAt";
                break;
            default:
                return defaultSort;
        }
        return JpaSort.unsafe(direction, property).and(defaultSort);
    }

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/search-paged")
    public ResponseEntity<ApiResponse<Page<RadarStationResponse>>> searchPaged(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String stationName,
            @RequestParam(required = false) String code,
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
            @RequestParam(required = false) String commissionedFrom,
            @RequestParam(required = false) String commissionedTo,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortOrder) {
        try {
            Sort sort = resolveSort(sortBy, sortOrder);
            PageRequest pageable = PageRequest.of(page, size, sort);
            Page<RadarStationResponse> responses = service.searchPaged(
                    keyword, stationName, code, orgUnitId, seaportId, vtsSystemId, vtsOperationCenterId,
                    operatingUnitId, provinceId, conditionStatus, approvalStatus, status,
                    updatedBy, parseUpdatedFrom(updatedFrom), parseUpdatedTo(updatedTo), pageable);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm trạm radar thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm phân trang trạm radar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    public ResponseEntity<ApiResponse<Page<RadarStationResponse>>> searchPaged(
            String keyword, String stationName, String code, UUID orgUnitId, UUID seaportId,
            UUID vtsSystemId, UUID vtsOperationCenterId, UUID operatingUnitId, Integer provinceId,
            String conditionStatus, String approvalStatus, String status, UUID updatedBy,
            String updatedFrom, String updatedTo,
            int page, int size, String sortBy, String sortOrder) {
        return searchPaged(keyword, stationName, code, orgUnitId, seaportId, vtsSystemId, vtsOperationCenterId,
                operatingUnitId, provinceId, conditionStatus, approvalStatus, status, updatedBy,
                null, null, updatedFrom, updatedTo, page, size, sortBy, sortOrder);
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:update', 'radarstation:approvec2')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RadarStationResponse>> update(@PathVariable UUID id,
            @Valid @RequestBody RadarStationUpdateRequest request,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.update(id, request, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:delete')")
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

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:create', 'radarstation:update', 'radarstation:approvec2')")
    @PostMapping(value = { "/{id}/submit", "/{id}/submit-approval" })
    public ResponseEntity<ApiResponse<RadarStationResponse>> submitForApproval(@PathVariable UUID id,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.submitForApproval(id, getUserId(authentication));
            return ResponseEntity.ok(ApiResponse.success("Đã gửi phê duyệt", response));
        } catch (Exception e) {
            log.warn("Lỗi khi gửi phê duyệt trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:approvec1')")
    @PostMapping(value = { "/{id}/approvec1", "/{id}/approve-l1", "/{id}/approve/c1" })
    public ResponseEntity<ApiResponse<RadarStationResponse>> approveLevel1(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.approveLevel1(id, getUserId(authentication), note);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi phê duyệt C1 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:approvec2')")
    @PostMapping(value = { "/{id}/approvec2", "/{id}/approve-l2", "/{id}/approve/c2" })
    public ResponseEntity<ApiResponse<RadarStationResponse>> approveLevel2(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.approveLevel2(id, getUserId(authentication), note);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi phê duyệt C2 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:approvec1')")
    @PostMapping(value = { "/{id}/rejectc1", "/{id}/reject", "/{id}/reject/c1" })
    public ResponseEntity<ApiResponse<RadarStationResponse>> rejectLevel1(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String rejectReason,
            Authentication authentication) {
        try {
            String r = reason != null && !reason.isBlank() ? reason : rejectReason;
            RadarStationResponse response = service.rejectLevel1(id, getUserId(authentication), r);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối cấp Chi cục", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C1 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:approvec2')")
    @PostMapping(value = { "/{id}/rejectc2", "/{id}/reject/c2" })
    public ResponseEntity<ApiResponse<RadarStationResponse>> rejectLevel2(
            @PathVariable UUID id,
            @RequestParam String reason,
            Authentication authentication) {
        try {
            RadarStationResponse response = service.rejectLevel2(id, getUserId(authentication), reason);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối cấp Cục", response));
        } catch (Exception e) {
            log.warn("Lỗi khi từ chối C2 trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:history', 'radarstation:read', 'data:read')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate) {
        try {
            List<HistoryEntry> history = service.getHistory(id, page, pageSize, keyword, fromDate, toDate);
            return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", history));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy lịch sử trạm radar id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(UUID id) {
        return getHistory(id, null, null, null, (String) null, (String) null);
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

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:create', 'radarstation:update', 'radarstation:approvec2')")
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<RadarStationAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        try {
            if (files == null || files.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Không có file nào được chọn để tải lên"));
            }
            List<RadarStationAttachmentResponse> responses = service.uploadAttachments(id, files,
                    getUserId(authentication));
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

    @PreAuthorize("@auth.checkAny(authentication, 'radarstation:manage', 'radarstation:update', 'radarstation:delete', 'radarstation:approvec2')")
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

    @PreAuthorize("@auth.check(authentication, 'radarstation:read')")
    @GetMapping("/{id}/attachments/{attId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        InfrastructureAttachment attachment = service.getAttachment(id, attId);
        Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(path);
        String contentType;
        try {
            contentType = Files.probeContentType(path);
        } catch (Exception ignored) {
            contentType = null;
        }
        MediaType mediaType = contentType == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + (attachment.getFileName() != null ? attachment.getFileName().replace("\"", "") : "attachment") + "\"")
                .body(resource);
    }

    private LocalDateTime parseUpdatedFrom(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty())
            return null;
        String s = dateStr.trim();
        try {
            if (s.length() == 10) {
                return LocalDate.parse(s).atStartOfDay();
            }
            return LocalDateTime.parse(s.replace(" ", "T"), DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(s.replace(" ", "T"));
            } catch (Exception e2) {
                return null;
            }
        }
    }

    private LocalDateTime parseUpdatedTo(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty())
            return null;
        String s = dateStr.trim();
        try {
            if (s.length() == 10) {
                return LocalDate.parse(s).atTime(23, 59, 59, 999_999_999);
            }
            LocalDateTime ldt = LocalDateTime.parse(s.replace(" ", "T"), DateTimeFormatter.ISO_DATE_TIME);
            if (ldt.getNano() == 0 || (ldt.getNano() == 999_000_000 && (s.endsWith(".999") || s.endsWith(":59")))) {
                return ldt.withNano(999_999_999);
            }
            return ldt;
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(s.replace(" ", "T"));
            } catch (Exception e2) {
                return null;
            }
        }
    }
}
