package com.hanghai.kchtg.navigationchannel.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelHistoryService;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for NavigationChannel (F-038 to F-043).
 * Class-level {@code @DataScope} activates orgUnitFilter + recordSecurityLevelFilter (data scope đọc).
 */
@RestController
@RequestMapping("/api/v1/navigation-channel")
@RequiredArgsConstructor
@DataScope
public class NavigationChannelController {

    private final NavigationChannelService service;
    private final NavigationChannelHistoryService historyService;
    private final NavigationChannelRepository repository;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> create(
            @RequestBody @Valid NavigationChannelCreateRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Tạo luồng hàng hải thành công", service.create(req, userId)));
    }

    @PostMapping("/create-and-approve")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create') and @auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> createAndApprove(
            @RequestBody @Valid NavigationChannelCreateRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Create and approve navigation channel successfully",
                service.createAndApprove(req, userId)));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:create')")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam(name = "orgUnitId") UUID orgUnitId) {
        String code = service.generateChannelCode(orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã luồng hàng hải thành công", java.util.Map.of("channelCode", code)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> getById(@PathVariable(name = "id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<NavigationChannelResponse>>> list(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size).getContent()));
    }

    @GetMapping("/options")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<NavigationChannelOptionResponse>>> getOptions(
            @RequestParam(name = "orgUnitId", required = false) UUID orgUnitId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách lựa chọn luồng hàng hải thành công",
                service.getOptions(orgUnitId)));
    }

    @PutMapping("/{id}")
    // Gửi duyệt là bước workflow; hồ sơ vừa tạo được phép gửi với quyền create; hồ sơ đã duyệt được sửa với quyền approvec2.
    @PreAuthorize("@auth.checkAny(authentication, 'navigationchannel:create', 'navigationchannel:update', 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> update(
            @PathVariable(name = "id") UUID id,
            @RequestBody @Valid NavigationChannelUpdateRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity
                .ok(ApiResponse.success("Cập nhật luồng hàng hải thành công", service.update(id, req, userId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable(name = "id") UUID id, Authentication authentication) {
        UUID userId = currentUserId(authentication);
        service.softDelete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm luồng hàng hải thành công", null));
    }

    /** Gửi hồ sơ đi phê duyệt (mới — F-038). */
    @PostMapping("/{id}/submit-approval")
    // Gửi duyệt từ hồ sơ vừa tạo chỉ cần quyền tạo; gửi lại sau khi sửa cần quyền cập nhật.
    @PreAuthorize("@auth.checkAny(authentication, 'navigationchannel:create', 'navigationchannel:update')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> submitApproval(
            @PathVariable(name = "id") UUID id,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", service.submit(id, userId)));
    }

    @PostMapping("/{id}/approve-direct")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<NavigationChannelResponse>> directApprove(
            @PathVariable(name = "id") UUID id,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Approve navigation channel directly successfully",
                service.directApprove(id, userId)));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC1(
            @PathVariable(name = "id") UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", service.approveC1(id, req, userId)));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> approveC2(
            @PathVariable(name = "id") UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", service.approveC2(id, req, userId)));
    }

    /** Trả về cấp 1 (mới — F-038). */
    @PostMapping("/{id}/reject-level-1")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec1')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> rejectLevel1(
            @PathVariable(name = "id") UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Trả về cấp 1 thành công", service.rejectLevel1(id, req, userId)));
    }

    /** Trả về cấp 2 (mới — F-038). */
    @PostMapping("/{id}/reject-level-2")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:approvec2')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> rejectLevel2(
            @PathVariable(name = "id") UUID id,
            @RequestBody @Valid ApprovalRequest req,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Trả về cấp 2 thành công", service.rejectLevel2(id, req, userId)));
    }

    // Một đường lịch sử duy nhất: đọc từ NavigationChannelHistoryService (gộp phiên cập nhật
    // LEVEL_1/LEVEL_2, lọc từ khóa + khoảng ngày Ở CSDL). Trước đây endpoint gọi
    // NavigationChannelService.getHistory(...) trả DTO HistoryEntry rời rạc, còn service mới chỉ
    // được gọi từ một method không có mapping — nên phần gộp/lọc của service mới không ai chạy.
    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:history')")
    public ResponseEntity<ApiResponse<List<NavigationChannelHistoryEntry>>> getHistory(
            @PathVariable(name = "id") UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate) {
        List<NavigationChannelHistoryEntry> entries =
                historyService.getHistory(id, page, pageSize, keyword, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", entries));
    }

    @GetMapping("/approval-status/{status}")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<List<NavigationChannelResponse>>> filterByStatus(@PathVariable(name = "status") String status) {
        return ResponseEntity.ok(ApiResponse.success(service.findByApprovalStatus(ApprovalStatus.valueOf(status))));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<SearchResultResponse>> search(
            @RequestParam(name = "orgUnitId", required = false) UUID orgUnitId,
            @RequestParam(name = "seaportId", required = false) UUID seaportId,
            @RequestParam(name = "provinceId", required = false) Integer provinceId,
            @RequestParam(name = "conditionStatus", required = false) ConditionStatus conditionStatus,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "channelCode", required = false) String channelCode,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @RequestParam(name = "updatedFrom", required = false) String updatedFrom,
            @RequestParam(name = "updatedTo", required = false) String updatedTo,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir,
            @RequestParam(name = "sortField", required = false) String sortField,
            @RequestParam(name = "sortOrder", required = false) String sortOrder) {
        String effectiveSortBy = (sortBy != null && !sortBy.isBlank()) ? sortBy : sortField;
        String effectiveSortDir = (sortDir != null && !sortDir.isBlank()) ? sortDir : sortOrder;
        return ResponseEntity.ok(ApiResponse.success(
                service.searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus,
                        keyword, channelCode, approvalStatus, updatedFrom, updatedTo, page, size, effectiveSortBy, effectiveSortDir)));
    }

    @GetMapping("/status-counts")
    @PreAuthorize("@auth.check(authentication, 'navigationchannel:read')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> countStatus(
            @RequestParam(name = "orgUnitId", required = false) UUID orgUnitId,
            @RequestParam(name = "seaportId", required = false) UUID seaportId,
            @RequestParam(name = "provinceId", required = false) Integer provinceId,
            @RequestParam(name = "conditionStatus", required = false) ConditionStatus conditionStatus,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "channelCode", required = false) String channelCode,
            @RequestParam(name = "updatedFrom", required = false) String updatedFrom,
            @RequestParam(name = "updatedTo", required = false) String updatedTo) {
        return ResponseEntity.ok(ApiResponse.success(
                service.countByStatus(orgUnitId, seaportId, provinceId, conditionStatus, keyword, channelCode, updatedFrom, updatedTo)));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'navigationchannel:manage', 'navigationchannel:create', 'navigationchannel:update', 'navigationchannel:approvec1', 'navigationchannel:approvec2', 'data:create', 'data:update')")
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<NavigationChannelAttachmentResponse>>> uploadAttachments(
            @PathVariable(name = "id") UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Tải tệp đính kèm thành công",
                service.uploadAttachments(id, files, userId)));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'navigationchannel:manage', 'navigationchannel:read', 'navigationchannel:view', 'data:read')")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<NavigationChannelAttachmentResponse>>> listAttachments(
            @PathVariable(name = "id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách tệp đính kèm thành công",
                service.listAttachments(id)));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'navigationchannel:manage', 'navigationchannel:create', 'navigationchannel:update', 'navigationchannel:delete', 'navigationchannel:approvec1', 'navigationchannel:approvec2', 'data:delete', 'data:update')")
    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable(name = "id") UUID id,
            @PathVariable(name = "attachmentId") UUID attachmentId,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        service.deleteAttachment(id, attachmentId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tệp đính kèm thành công", null));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'navigationchannel:manage', 'navigationchannel:read', 'navigationchannel:view', 'data:read')")
    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable(name = "id") UUID id,
            @PathVariable(name = "attachmentId") UUID attachmentId) {
        InfrastructureAttachment attachment = service.getAttachment(id, attachmentId);
        Path path = resolveAttachmentFilePath(attachment, id);
        if (path == null || !Files.isRegularFile(path)) {
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
        String originalFileName = attachment.getFileName() != null ? attachment.getFileName().replace("\"", "") : "attachment";
        String encodedFileName = java.net.URLEncoder.encode(originalFileName, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + originalFileName + "\"; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }

    private Path resolveAttachmentFilePath(InfrastructureAttachment attachment, UUID id) {
        if (attachment == null || attachment.getFilePath() == null) {
            return null;
        }
        String rawPath = attachment.getFilePath();

        // 1. Kiểm tra trực tiếp đường dẫn lưu trữ
        try {
            Path directPath = Paths.get(rawPath).toAbsolutePath().normalize();
            if (Files.isRegularFile(directPath)) {
                return directPath;
            }
        } catch (Exception ignored) {
        }

        // 2. Kiểm tra đường dẫn tương đối theo thư mục chạy ứng dụng
        try {
            Path cwdRelative = Paths.get(".").toAbsolutePath().normalize().resolve(rawPath).normalize();
            if (Files.isRegularFile(cwdRelative)) {
                return cwdRelative;
            }
        } catch (Exception ignored) {
        }

        // 3. Chuẩn hóa đường dẫn chứa "uploads/"
        try {
            String normalizedRaw = rawPath.replace("\\", "/");
            int uploadsIdx = normalizedRaw.indexOf("uploads/");
            if (uploadsIdx >= 0) {
                String subPath = normalizedRaw.substring(uploadsIdx);
                Path fromUploads = Paths.get(subPath).toAbsolutePath().normalize();
                if (Files.isRegularFile(fromUploads)) {
                    return fromUploads;
                }
            }
        } catch (Exception ignored) {
        }

        // 4. Tìm kiếm trong thư mục đính kèm của luồng hàng hải
        try {
            List<Path> candidateDirs = List.of(
                    Paths.get("uploads", "navigation_channel", id.toString()).toAbsolutePath().normalize(),
                    Paths.get("uploads", "navigation-channel", id.toString()).toAbsolutePath().normalize());
            String targetFileName = attachment.getFileName();
            for (Path entityDir : candidateDirs) {
                if (Files.isDirectory(entityDir)) {
                    try (var stream = Files.list(entityDir)) {
                        java.util.Optional<Path> match = stream
                                .filter(Files::isRegularFile)
                                .filter(p -> {
                                    String fname = p.getFileName().toString();
                                    return fname.endsWith(targetFileName)
                                            || fname.equalsIgnoreCase(targetFileName)
                                            || (targetFileName != null && fname.contains(targetFileName))
                                            || rawPath.contains(fname);
                                })
                                .findFirst();
                        if (match.isPresent()) {
                            return match.get();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    private UUID currentUserId(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
    }
}
