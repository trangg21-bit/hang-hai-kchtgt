package com.hanghai.kchtg.dikerevetment.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
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
import java.util.Set;
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
        return SecurityUtils.getCurrentUserId();
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
            @RequestParam(required = false) String dikeRevetmentName,
            @RequestParam(required = false) String conditionStatus) {
        try {
            Map<String, Long> counts = service.getTabCounts(orgUnitId, keyword, dikeRevetmentName, conditionStatus);
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

    public static Sort resolveSort(String sortBy, String sortOrder) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortOrder) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "d.updatedAt")
                .and(JpaSort.unsafe(Sort.Direction.DESC, "d.createdAt"))
                .and(JpaSort.unsafe(Sort.Direction.ASC, "d.id"));
        if (sortBy == null || sortBy.isBlank()) {
            return defaultSort;
        }
        String field = sortBy.trim();
        String property;
        switch (field) {
            case "code":
                property = "LOWER(d.code)";
                break;
            case "dikeRevetmentName":
            case "codeAndName":
            case "name":
                property = "LOWER(d.dikeRevetmentName)";
                break;
            case "location":
                property = "LOWER(d.location)";
                break;
            case "dikeRevetmentType":
                property = "d.dikeRevetmentType";
                break;
            case "orgUnitName":
            case "orgUnitId":
                property = "LOWER(o.name)";
                break;
            case "seaportName":
            case "seaportId":
                property = "LOWER(p.portName)";
                break;
            case "length":
                property = "d.length";
                break;
            case "crestElevation":
                property = "d.crestElevation";
                break;
            case "commissioningDate":
                property = "d.commissioningDate";
                break;
            case "constructionDate":
                property = "d.constructionDate";
                break;
            case "lastMaintenanceYear":
                property = "d.lastMaintenanceYear";
                break;
            case "height":
                property = "d.height";
                break;
            case "surfaceMaterial":
                property = "LOWER(d.surfaceMaterial)";
                break;
            case "status":
            case "conditionStatus":
                property = "d.status";
                break;
            case "approvalStatus":
                property = "d.approvalStatus";
                break;
            case "submittedByName":
            case "submittedAt":
                property = "d.submittedAt";
                break;
            case "approvedByNameLevel1":
            case "approverLevel1Name":
            case "approvedDateLevel1":
                property = "d.approvedDateLevel1";
                break;
            case "approvedByNameLevel2":
            case "approverLevel2Name":
            case "approvedDateLevel2":
                property = "d.approvedDateLevel2";
                break;
            case "updatedByName":
            case "updatedAt":
                property = "d.updatedAt";
                break;
            case "createdAt":
                property = "d.createdAt";
                break;
            default:
                return defaultSort;
        }
        return JpaSort.unsafe(direction, property).and(defaultSort);
    }

    @GetMapping("/search-paged")
    @PreAuthorize("@auth.checkAny(authentication, 'dikerevetment:manage', 'dikerevetment:read', 'data:read')")
    public ResponseEntity<ApiResponse<Page<DikeRevetmentResponse>>> searchPaged(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String dikeRevetmentName,
            @RequestParam(required = false) UUID seaportId,
            @RequestParam(required = false) DikeRevetmentType dikeRevetmentType,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) Boolean isDeleted,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer commissioningYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortOrder) {
        try {
            Sort sort = resolveSort(sortBy, sortOrder);
            PageRequest pageable = PageRequest.of(page, size, sort);
            Page<DikeRevetmentResponse> responses = service.searchPaged(
                    orgUnitId, keyword, dikeRevetmentName, seaportId, dikeRevetmentType, conditionStatus,
                    approvalStatus, isDeleted, updatedBy, parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo),
                    code, location, commissioningYear, pageable);
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
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate) {
        return ResponseEntity.ok(ApiResponse.success(service.getHistory(id, page, pageSize, keyword, fromDate, toDate)));
    }

    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(UUID id) {
        return getHistory(id, null, null, null, null, null);
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:update') or @auth.check(authentication, 'dikerevetment:create')")
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        List<VtsSystemAttachmentResponse> uploaded = service.uploadAttachments(id, files, getUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> listAttachments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.listAttachments(id)));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:update') or @auth.check(authentication, 'dikerevetment:create') or @auth.check(authentication, 'dikerevetment:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        service.deleteAttachment(id, attId, getUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tệp đính kèm", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.check(authentication, 'dikerevetment:read')")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) throws java.io.IOException {
        InfrastructureAttachment att = service.getAttachment(id, attId);
        java.nio.file.Path p = java.nio.file.Paths.get(att.getFilePath());
        byte[] data = java.nio.file.Files.readAllBytes(p);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + att.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
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
