package com.hanghai.kchtg.aissystem.controller;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;

import com.hanghai.kchtg.aissystem.dto.AisSystemListItem;
import com.hanghai.kchtg.aissystem.dto.AisSystemOptionResponse;
import com.hanghai.kchtg.aissystem.dto.AisSystemRequest;
import com.hanghai.kchtg.aissystem.dto.AisSystemResponse;
import com.hanghai.kchtg.aissystem.dto.HistoryEntry;
import com.hanghai.kchtg.aissystem.service.AisSystemService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.ApprovalRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.util.ApprovalUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.hanghai.kchtg.security.annotation.DataScope;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ais-system")
@RequiredArgsConstructor
@Slf4j
// approval-2-level-spec §3.8: controller của thực thể KCHT phải khai @DataScope
// để bộ lọc theo đơn vị được áp dụng cho mọi truy vấn trong request.
@DataScope
public class AisSystemController {

    /**
     * Các cột được phép sắp xếp. `sortBy` đến từ client nên phải qua danh sách
     * trắng: tên thuộc tính lạ sẽ làm truy vấn ném lỗi 500, và các cột hiển thị
     * tên (đơn vị, cán bộ) được resolve sau truy vấn nên không sắp xếp được ở DB.
     */
    private static final Map<String, String> SORTABLE_LIST_FIELDS = Map.of(
            "name", "name",
            "code", "code",
            "detailedLocation", "detailedLocation",
            "conditionStatus", "conditionStatus",
            "approvalStatus", "approvalStatus",
            "provinceId", "provinceId",
            "updatedDate", "updatedAt",
            "createdAt", "createdAt");

    private static Sort resolveListSort(String sortBy, String sortDir) {
        Sort defaultSort = Sort.by(Sort.Direction.DESC, "createdAt");
        String property = sortBy == null ? null : SORTABLE_LIST_FIELDS.get(sortBy.trim());
        if (property == null) {
            return defaultSort;
        }
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        // Chốt thêm createdAt để thứ tự ổn định khi giá trị sắp xếp trùng nhau.
        return Sort.by(direction, property).and(defaultSort);
    }

    private final AisSystemService service;

    @PreAuthorize("@auth.check(authentication, 'aissystem:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<AisSystemResponse>> create(
            @Valid @RequestBody AisSystemRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        AisSystemResponse response = service.create(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới hệ thống AIS thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:create')")
    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã thành công", Map.of("code", code)));
    }

    // Dropdown dùng liên module (form khác cũng cần danh sách này) nên không gắn
    // `aissystem:read` — phạm vi dữ liệu do data scope trong query đảm nhiệm.
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<AisSystemOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        List<AisSystemOptionResponse> options = service.getOptions(orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tùy chọn hệ thống AIS thành công", options));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AisSystemResponse>> getById(@PathVariable UUID id) {
        AisSystemResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID vtsOperationCenterId,
            @RequestParam(required = false) UUID radarStationId,
            @RequestParam(required = false) UUID operatingOrgId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) Integer commissioningYear,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        PageRequest pageRequest = PageRequest.of(page, size, resolveListSort(sortBy, sortDir));

        Page<AisSystemListItem> resultPage = service.search(
                keyword, name, code, orgUnitId, vtsOperationCenterId, radarStationId, operatingOrgId,
                provinceId, conditionStatus, commissioningYear, approvalStatus,
                updatedFrom, updatedTo, pageRequest);
        Map<String, Long> statusCounts = service.countByStatus(
                keyword, name, code, orgUnitId, vtsOperationCenterId, radarStationId, operatingOrgId,
                provinceId, conditionStatus, commissioningYear,
                updatedFrom, updatedTo);

        Map<String, Object> data = new HashMap<>();
        data.put("content", resultPage.getContent());
        data.put("totalElements", resultPage.getTotalElements());
        data.put("totalPages", resultPage.getTotalPages());
        data.put("number", resultPage.getNumber());
        data.put("size", resultPage.getSize());
        data.put("statusCounts", statusCounts);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", data));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AisSystemResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody AisSystemRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        AisSystemResponse response = service.update(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hệ thống AIS thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        service.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa hệ thống AIS thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:update')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        service.submit(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:approvec1')")
    @PostMapping("/{id}/approve-c1")
    public ResponseEntity<ApiResponse<Void>> approveC1(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        String decision = ApprovalUtils.resolveDecision(request);
        String reason = ApprovalUtils.resolveReason(request);
        service.approveC1(id, decision, reason, userId);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:approvec2')")
    @PostMapping("/{id}/approve-c2")
    public ResponseEntity<ApiResponse<Void>> approveC2(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        String decision = ApprovalUtils.resolveDecision(request);
        String reason = ApprovalUtils.resolveReason(request);
        service.approveC2(id, decision, reason, userId);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", null));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'aissystem:approvec1', 'aissystem:approvec2')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        String reason = ApprovalUtils.resolveReason(request, "Từ chối hồ sơ");
        service.reject(id, reason, userId);
        return ResponseEntity.ok(ApiResponse.success("Từ chối phê duyệt thành công", null));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'aissystem:read', 'aissystem:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        List<HistoryEntry> history = service.getHistory(id, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử thành công", history));
    }

    // OR-logic: `check(Authentication, String...)` là alias của `checkAny`. Dùng
    // `checkAny` cho đúng nghĩa để người đọc không hiểu nhầm là bắt buộc cả hai.
    @PreAuthorize("@auth.checkAny(authentication, 'aissystem:create', 'aissystem:update')")
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        List<VtsSystemAttachmentResponse> uploaded = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:read')")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> listAttachments(@PathVariable UUID id) {
        List<VtsSystemAttachmentResponse> list = service.listAttachments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tệp đính kèm thành công", list));
    }

    @PreAuthorize("@auth.check(authentication, 'aissystem:update')")
    @DeleteMapping("/{id}/attachments/{attId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tệp đính kèm thành công", null));
    }

    
    @PreAuthorize("@auth.check(authentication, 'aissystem:read')")
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

    private final UserRepository userRepository;

    private UUID getUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User u) {
            return u.getId();
        }
        if (authentication != null && authentication.getName() != null) {
            return userRepository.findByUsername(authentication.getName()).map(User::getId).orElse(null);
        }
        UUID fromContext = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        if (fromContext != null) {
            return fromContext;
        }
        org.springframework.security.core.Authentication secAuth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (secAuth != null && secAuth.getName() != null) {
            return userRepository.findByUsername(secAuth.getName()).map(User::getId).orElse(null);
        }
        return null;
    }
}
