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
import org.springframework.data.jpa.domain.JpaSort;
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

    /** Trần số bản ghi mỗi trang cho endpoint danh sách. */
    private static final int MAX_PAGE_SIZE = 200;

    /**
     * Các cột được phép sắp xếp. `sortBy` đến từ client nên phải qua danh sách
     * trắng: tên thuộc tính lạ sẽ làm truy vấn ném lỗi 500.
     *
     * Cột hiển thị tên (đơn vị quản lý, đơn vị vận hành, trung tâm điều hành)
     * trỏ vào alias của các LEFT JOIN trong {@code AisSystemRepository.search} để
     * sắp theo đúng chữ người dùng nhìn thấy. Riêng "Đơn vị vận hành khai thác"
     * lấy tên từ `operating_organization`, thiếu thì mới lùi về `org_units`
     * (xem {@code AisSystemService.toListItem}) nên phải sắp bằng COALESCE.
     *
     * Ngoại lệ: Tỉnh/TP chỉ có mã số trong CSDL (chưa có entity Province để join)
     * nên sắp theo mã tỉnh — trùng với thứ tự mã hành chính.
     */
    private static final Map<String, String> SORTABLE_LIST_FIELDS = Map.ofEntries(
            Map.entry("name", "t.name"),
            Map.entry("code", "t.code"),
            Map.entry("detailedLocation", "t.detailedLocation"),
            Map.entry("conditionStatus", "t.conditionStatus"),
            Map.entry("approvalStatus", "t.approvalStatus"),
            Map.entry("province", "t.provinceId"),
            Map.entry("provinceId", "t.provinceId"),
            Map.entry("unitOfMeasure", "t.unitOfMeasure"),
            Map.entry("quantity", "t.quantity"),
            Map.entry("commissioningYear", "t.commissioningYear"),
            Map.entry("orgUnitName", "o.name"),
            Map.entry("orgUnitId", "t.orgUnitId"),
            Map.entry("operatingOrgName", "COALESCE(oo.name, oorg.name)"),
            Map.entry("operatingOrgId", "t.operatingOrgId"),
            Map.entry("rejectionReason", "t.rejectionReason"),
            Map.entry("vtsOperationCenterName", "COALESCE(voc.name, rs.stationName)"),
            Map.entry("radarStationId", "t.radarStationId"),
            Map.entry("updatedByName", "COALESCE(u.fullName, uCreate.fullName)"),
            Map.entry("updatedBy", "t.updatedBy"),
            Map.entry("updatedAt", "t.updatedAt"),
            Map.entry("createdAt", "t.createdAt"));

    public static final String PROVINCE_ORDER_EXPR = """
        (CASE t.provinceId
            WHEN 89 THEN 1 WHEN 77 THEN 2 WHEN 24 THEN 3 WHEN 6 THEN 4 WHEN 95 THEN 5
            WHEN 27 THEN 6 WHEN 83 THEN 7 WHEN 52 THEN 8 WHEN 74 THEN 9 WHEN 70 THEN 10
            WHEN 60 THEN 11 WHEN 96 THEN 12 WHEN 92 THEN 13 WHEN 4 THEN 14 WHEN 48 THEN 15
            WHEN 66 THEN 16 WHEN 67 THEN 17 WHEN 11 THEN 18 WHEN 75 THEN 19 WHEN 87 THEN 20
            WHEN 64 THEN 21 WHEN 2 THEN 22 WHEN 35 THEN 23 WHEN 1 THEN 24 WHEN 42 THEN 25
            WHEN 30 THEN 26 WHEN 31 THEN 27 WHEN 93 THEN 28 WHEN 17 THEN 29 WHEN 33 THEN 30
            WHEN 56 THEN 31 WHEN 91 THEN 32 WHEN 62 THEN 33 WHEN 12 THEN 34 WHEN 68 THEN 35
            WHEN 20 THEN 36 WHEN 10 THEN 37 WHEN 80 THEN 38 WHEN 36 THEN 39 WHEN 40 THEN 40
            WHEN 37 THEN 41 WHEN 58 THEN 42 WHEN 25 THEN 43 WHEN 54 THEN 44 WHEN 44 THEN 45
            WHEN 49 THEN 46 WHEN 51 THEN 47 WHEN 22 THEN 48 WHEN 45 THEN 49 WHEN 94 THEN 50
            WHEN 14 THEN 51 WHEN 72 THEN 52 WHEN 34 THEN 53 WHEN 19 THEN 54 WHEN 38 THEN 55
            WHEN 46 THEN 56 WHEN 82 THEN 57 WHEN 79 THEN 58 WHEN 84 THEN 59 WHEN 8 THEN 60
            WHEN 86 THEN 61 WHEN 26 THEN 62 WHEN 15 THEN 63 ELSE 999 END)
        """.replaceAll("\\s+", " ").trim();

    /**
     * Dùng {@link JpaSort#unsafe} vì thuộc tính đã được qualify sẵn theo alias và
     * có trường hợp là biểu thức COALESCE / CASE — {@code Sort.by} sẽ từ chối cả hai.
     * An toàn vì giá trị luôn lấy từ danh sách trắng ở trên hoặc biểu thức kiểm soát chặt chẽ,
     * không phải chuỗi thô của client.
     */
    public static Sort resolveListSort(String sortBy, String sortDir, String sort) {
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "t.createdAt");
        String field = null;
        Sort.Direction direction = Sort.Direction.DESC;

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            field = parts[0].trim();
            if (parts.length > 1 && "ASC".equalsIgnoreCase(parts[1].trim())) {
                direction = Sort.Direction.ASC;
            }
        } else if (sortBy != null && !sortBy.isBlank()) {
            field = sortBy.trim();
            if ("ASC".equalsIgnoreCase(sortDir)) {
                direction = Sort.Direction.ASC;
            }
        }

        if (field == null) {
            return defaultSort;
        }

        if ("name".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(direction, "LOWER(t.name)")
                    .and(JpaSort.unsafe(direction, "LOWER(t.code)"))
                    .and(defaultSort);
        }

        if ("code".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(direction, "LOWER(t.code)")
                    .and(JpaSort.unsafe(direction, "LOWER(t.name)"))
                    .and(defaultSort);
        }

        if ("province".equalsIgnoreCase(field) || "provinceId".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(direction, PROVINCE_ORDER_EXPR)
                    .and(JpaSort.unsafe(direction, "LOWER(t.name)"))
                    .and(defaultSort);
        }

        String property = SORTABLE_LIST_FIELDS.get(field);
        if (property == null) {
            return defaultSort;
        }
        return JpaSort.unsafe(direction, property).and(defaultSort);
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
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "true") boolean includeCounts) {

        // Chặn trần số bản ghi mỗi trang:  đến từ client, không giới hạn thì một
        // request  kéo cả bảng ra khỏi CSDL.
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(page, safeSize, resolveListSort(sortBy, sortDir, sort));

        Page<AisSystemListItem> resultPage = service.search(
                keyword, name, code, orgUnitId, vtsOperationCenterId, radarStationId, operatingOrgId,
                provinceId, conditionStatus, commissioningYear, approvalStatus,
                updatedFrom, updatedTo, pageRequest);
        // Số đếm theo trạng thái không đổi khi người dùng chỉ lật trang hay đổi cột
        // sắp xếp, nên client tắt cờ này để khỏi chạy thêm một truy vấn GROUP BY.
        Map<String, Long> statusCounts = includeCounts
                ? service.countByStatus(
                        keyword, name, code, orgUnitId, vtsOperationCenterId, radarStationId, operatingOrgId,
                        provinceId, conditionStatus, commissioningYear,
                        updatedFrom, updatedTo)
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
