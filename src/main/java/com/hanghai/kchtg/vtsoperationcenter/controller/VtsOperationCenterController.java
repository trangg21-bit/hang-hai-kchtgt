package com.hanghai.kchtg.vtsoperationcenter.controller;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.ApprovalRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.util.ApprovalUtils;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.dto.HistoryEntry;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterListItem;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterRequest;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterResponse;
import com.hanghai.kchtg.vtsoperationcenter.service.VtsOperationCenterService;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/vts-operation-center")
@RequiredArgsConstructor
@Slf4j
// approval-2-level-spec §3.8: controller của thực thể KCHT phải khai @DataScope
// để bộ lọc theo đơn vị được áp dụng cho mọi truy vấn trong request.
@DataScope
public class VtsOperationCenterController {

    private final VtsOperationCenterService service;

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<VtsOperationCenterResponse>> create(
            @Valid @RequestBody VtsOperationCenterRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        VtsOperationCenterResponse response = service.create(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới trung tâm điều hành VTS thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:create')")
    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã thành công", Map.of("code", code)));
    }

    /** Trần số bản ghi mỗi trang cho endpoint danh sách. */
    private static final int MAX_PAGE_SIZE = 200;

    /**
     * Các cột được phép sắp xếp. `sortBy` đến từ client nên phải qua danh sách
     * trắng: tên thuộc tính lạ sẽ làm truy vấn ném lỗi 500.
     *
     * Cột hiển thị tên (đơn vị quản lý, cảng biển, hệ thống VTS, cán bộ cập nhật)
     * trỏ vào alias của các LEFT JOIN trong {@code VtsOperationCenterRepository.search}
     * để sắp theo đúng chữ người dùng nhìn thấy, thay vì theo UUID.
     *
     * Tỉnh/TP được sắp theo tên người dùng nhìn thấy, không theo mã hành chính.
     */
    static final Map<String, String> SORTABLE_LIST_FIELDS = Map.ofEntries(
            Map.entry("name", "name"),
            Map.entry("code", "code"),
            Map.entry("vtsSystemId", "vtsSystemId"),
            Map.entry("vtsSystemName", "vs.systemName"),
            Map.entry("portId", "portId"),
            Map.entry("portName", "p.portName"),
            Map.entry("orgUnitId", "orgUnitId"),
            Map.entry("orgUnitName", "o.name"),
            Map.entry("detailedLocation", "detailedLocation"),
            Map.entry("conditionStatus", "conditionStatus"),
            Map.entry("approvalStatus", "approvalStatus"),
            Map.entry("province", "provinceId"),
            Map.entry("provinceId", "provinceId"),
            Map.entry("rejectionReason", "rejectionReason"),
            Map.entry("updatedByName", "u.fullName"),
            Map.entry("updatedAt", "updatedAt"),
            Map.entry("updatedDate", "updatedAt"),
            Map.entry("createdAt", "createdAt"),
            Map.entry("submittedByName", "uSub.fullName"),
            Map.entry("submittedAt", "submittedAt"),
            Map.entry("submittedDate", "submittedAt"),
            Map.entry("approverLevel1Name", "uApp1.fullName"),
            Map.entry("approvedDateLevel1", "approvedDateLevel1"),
            Map.entry("approverLevel2Name", "uApp2.fullName"),
            Map.entry("approvedDateLevel2", "approvedDateLevel2"));

    public static Sort resolveListSort(String sortBy, String sortDir) {
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "createdAt");
        if (sortBy == null || sortBy.isBlank()) {
            return defaultSort;
        }
        String cleanSortBy = sortBy.trim();
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // 1. Tên / Mã TTDH VTS
        if ("name".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN t.name IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(t.name)"))
                    .and(JpaSort.unsafe(direction, "LOWER(t.code)"))
                    .and(defaultSort);
        }
        if ("code".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN t.code IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(t.code)"))
                    .and(JpaSort.unsafe(direction, "LOWER(t.name)"))
                    .and(defaultSort);
        }

        // 2. Đơn vị quản lý
        if ("orgUnitName".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN o.name IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(o.name)"))
                    .and(defaultSort);
        }

        // 3. Thuộc cảng biển
        if ("portName".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN p.portName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(p.portName)"))
                    .and(defaultSort);
        }

        // 4. Thuộc hệ thống VTS (Xử lý lỗi: NULLS LAST + LOWER)
        if ("vtsSystemName".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN vs.systemName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(vs.systemName)"))
                    .and(defaultSort);
        }

        // 5. Địa điểm (Tỉnh/TP)
        if ("province".equalsIgnoreCase(cleanSortBy) || "provinceId".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN pv.id IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "pv.sortOrder"))
                    .and(JpaSort.unsafe(direction, "LOWER(t.name)"))
                    .and(defaultSort);
        }

        // 6. Cán bộ cập nhật (u.fullName || uCreated.fullName)
        if ("updatedByName".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN COALESCE(u.fullName, uCreated.fullName) IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(COALESCE(u.fullName, uCreated.fullName))"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "COALESCE(t.updatedAt, t.createdAt)"))
                    .and(defaultSort);
        }

        // 7. Cán bộ gửi phê duyệt
        if ("submittedByName".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN uSub.fullName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(uSub.fullName)"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "t.submittedAt"))
                    .and(defaultSort);
        }

        // 8. Cán bộ phê duyệt cấp Cảng vụ/Chi cục
        if ("approverLevel1Name".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN uApp1.fullName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(uApp1.fullName)"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "t.approvedDateLevel1"))
                    .and(defaultSort);
        }

        // 9. Cán bộ phê duyệt cấp Cục
        if ("approverLevel2Name".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN uApp2.fullName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(uApp2.fullName)"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "t.approvedDateLevel2"))
                    .and(defaultSort);
        }

        // 10. Lý do từ chối
        if ("rejectionReason".equalsIgnoreCase(cleanSortBy)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN t.rejectionReason IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(t.rejectionReason)"))
                    .and(defaultSort);
        }

        // 11. Các cột còn lại (ID, Enum, Dates...)
        String property = SORTABLE_LIST_FIELDS.get(cleanSortBy);
        if (property == null) {
            return defaultSort;
        }
        String caseExpr = property.contains(".") ? property : ("t." + property);
        return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN " + caseExpr + " IS NULL THEN 1 ELSE 0 END)")
                .and(JpaSort.unsafe(direction, property))
                .and(defaultSort);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<VtsOperationCenterOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        List<VtsOperationCenterOptionResponse> options = service.getOptions(orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tùy chọn trung tâm điều hành VTS thành công", options));
    }

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VtsOperationCenterResponse>> getById(@PathVariable UUID id) {
        VtsOperationCenterResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID vtsSystemId,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            // Khoảng ngày cập nhật (bộ lọc nâng cao) — ISO-8601, ví dụ 2026-08-01T00:00:00
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "true") boolean includeCounts) {

        // Chặn trần số bản ghi mỗi trang: "size" đến từ client, không giới hạn thì
        // một request "size=100000" kéo cả bảng ra khỏi CSDL.
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(page, safeSize, resolveListSort(sortBy, sortDir));

        Page<VtsOperationCenterListItem> resultPage = service.search(keyword, name, code, orgUnitId, vtsSystemId, portId,
                provinceId, conditionStatus, approvalStatus, updatedFrom, updatedTo, pageRequest);
        // Số đếm theo trạng thái không đổi khi người dùng chỉ lật trang hay đổi cột
        // sắp xếp, nên client tắt cờ này để khỏi chạy thêm một truy vấn GROUP BY.
        Map<String, Long> statusCounts = includeCounts
                ? service.countByStatus(keyword, name, code, orgUnitId, vtsSystemId, portId,
                        provinceId, conditionStatus, updatedFrom, updatedTo)
                : Map.of();

        Map<String, Object> data = new HashMap<>();
        data.put("content", resultPage.getContent());
        data.put("totalElements", resultPage.getTotalElements());
        data.put("totalPages", resultPage.getTotalPages());
        data.put("number", resultPage.getNumber());
        data.put("size", resultPage.getSize());
        data.put("statusCounts", statusCounts);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", data));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vtsoperationcenter:update', 'vtsoperationcenter:approvec2')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VtsOperationCenterResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody VtsOperationCenterRequest request,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        VtsOperationCenterResponse response = service.update(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trung tâm điều hành VTS thành công", response));
    }

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        service.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa trung tâm điều hành VTS thành công", null));
    }

    // Gửi duyệt là bước workflow; hồ sơ vừa tạo được phép gửi với quyền create.
    @PreAuthorize("@auth.checkAny(authentication, 'vtsoperationcenter:create', 'vtsoperationcenter:update')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        service.submit(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", null));
    }

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:approvec1')")
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

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:approvec2')")
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

    @PreAuthorize("@auth.checkAny(authentication, 'vtsoperationcenter:approvec1', 'vtsoperationcenter:approvec2')")
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

    @PreAuthorize("@auth.checkAny(authentication, 'vtsoperationcenter:read', 'vtsoperationcenter:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            // Lọc nhật ký ở server để drawer phân trang được mà ô tìm kiếm vẫn quét
            // toàn bộ nhật ký, không chỉ phần đã tải về.
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        List<HistoryEntry> history = service.getHistory(id, page, pageSize, keyword, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử thành công", history));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vtsoperationcenter:create', 'vtsoperationcenter:update', 'vtsoperationcenter:approvec2')")
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        List<VtsSystemAttachmentResponse> uploaded = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:read')")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<VtsSystemAttachmentResponse>>> listAttachments(@PathVariable UUID id) {
        List<VtsSystemAttachmentResponse> list = service.listAttachments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tệp đính kèm thành công", list));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'vtsoperationcenter:update', 'vtsoperationcenter:approvec2')")
    @DeleteMapping("/{id}/attachments/{attId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tệp đính kèm thành công", null));
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

        // 4. Tìm kiếm trong thư mục đính kèm của trung tâm VTS
        try {
            List<Path> candidateDirs = List.of(
                    Paths.get("uploads", "vts_operation_center", id.toString()).toAbsolutePath().normalize(),
                    Paths.get("uploads", "vts-operation-center", id.toString()).toAbsolutePath().normalize());
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

    @PreAuthorize("@auth.check(authentication, 'vtsoperationcenter:read')")
    @GetMapping("/{id}/attachments/{attId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        InfrastructureAttachment attachment = service.getAttachment(id, attId);
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
                        "attachment; filename=\"" + originalFileName + "\"; filename*=UTF-8''" + encodedFileName)
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
        UUID fromContext = SecurityUtils.getCurrentUserId();
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
