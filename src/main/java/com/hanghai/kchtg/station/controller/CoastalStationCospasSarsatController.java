package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.cospas.*;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.station.service.CoastalStationCospasSarsatService;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping({"/api/v1/stations/cospas-sarsat", "/api/v1/stations/cospas"})
@Validated
@RequiredArgsConstructor
@Tag(name = "Cospas-Sarsat Coastal Station", description = "Quản lý Đài thông tin vệ tinh Cospas-Sarsat")
@DataScope
public class CoastalStationCospasSarsatController {

    private static final int MAX_PAGE_SIZE = 200;
    /**
     * Client sort keys mapped to the aliases defined by repository.search.
     * This is deliberately a whitelist: the sort parameter comes from the browser,
     * while a few visible columns are values from joined tables rather than fields
     * of CoastalStationCospasSarsat itself.
     */
    private static final Map<String, String> SORTABLE_LIST_FIELDS = Map.ofEntries(
            Map.entry("name", "c.name"),
            Map.entry("stationName", "c.name"),
            Map.entry("code", "c.code"),
            Map.entry("stationCode", "c.code"),
            Map.entry("orgUnitName", "o.name"),
            Map.entry("orgUnitId", "c.orgUnitId"),
            Map.entry("operatingOrgName", "COALESCE(oo.name, oorg.name)"),
            Map.entry("operatingOrgId", "c.operatingOrgId"),
            Map.entry("provinceId", "c.provinceId"),
            Map.entry("locationAddress", "c.locationAddress"),
            Map.entry("conditionStatus", "c.conditionStatus"),
            Map.entry("approvalStatus", "c.approvalStatus"),
            Map.entry("rejectionReason", "c.rejectionReason"),
            Map.entry("updatedByName", "COALESCE(uu.fullName, uc.fullName)"),
            Map.entry("updatedInfo", "COALESCE(uu.fullName, uc.fullName)"),
            Map.entry("submittedByName", "us.fullName"),
            Map.entry("submittedInfo", "us.fullName"),
            Map.entry("approverLevel1Name", "ua1.fullName"),
            Map.entry("approvedLevel1Info", "ua1.fullName"),
            Map.entry("approverLevel2Name", "ua2.fullName"),
            Map.entry("approvedLevel2Info", "ua2.fullName"),
            Map.entry("updatedAt", "c.updatedAt"),
            Map.entry("submittedAt", "c.submittedAt"),
            Map.entry("approvedDateLevel1", "c.approvedDateLevel1"),
            Map.entry("approvedDateLevel2", "c.approvedDateLevel2"),
            Map.entry("createdAt", "c.createdAt"));

    private final CoastalStationCospasSarsatService service;

    @GetMapping("/generate-code")
    @Operation(summary = "Tự sinh mã Đài Cospas-Sarsat (SARSAT-xxxxxx)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:create', 'specialstation:create', 'data:create')")
    public ResponseEntity<Map<String, String>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(Map.of("code", code));
    }

    @PostMapping({"", "/create"})
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:create', 'specialstation:create', 'data:create')")
    @Operation(summary = "Tạo mới Đài Cospas-Sarsat")
    public ResponseEntity<CoastalStationCospasSarsat> createStation(
            @Valid @RequestBody CoastalStationCospasSarsatRequest request) {
        CoastalStationCospasSarsat created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:update', 'specialstation:update', 'data:update', 'coastalstationcospassarsat:approvec2', 'specialstation:approvec2', 'data:approvec2')")
    @Operation(summary = "Cập nhật Đài Cospas-Sarsat")
    public ResponseEntity<CoastalStationCospasSarsat> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationCospasSarsatUpdateRequest request) {
        CoastalStationCospasSarsat updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:delete', 'specialstation:delete', 'data:delete')")
    @Operation(summary = "Xóa mềm Đài Cospas-Sarsat (chỉ khi DRAFT)")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Xem chi tiết Đài Cospas-Sarsat theo ID")
    public ResponseEntity<CoastalStationCospasSarsatResponse> getStationById(@PathVariable UUID id) {
        CoastalStationCospasSarsat entity = service.getStationById(id);
        CoastalStationCospasSarsatResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Tìm kiếm phân trang danh sách Đài Cospas-Sarsat chuẩn VTS")
    public ResponseEntity<?> searchOrList(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID operatingOrgId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "true") boolean includeCounts,
            @RequestParam(required = false) String sort) {

        // Tương thích ngược: nếu không truyền tham số phân trang / bộ lọc nào, trả về danh sách đầy đủ
        if (page == null && size == null && keyword == null && name == null && code == null
                && orgUnitId == null && operatingOrgId == null && conditionStatus == null
                && approvalStatus == null && provinceId == null) {
            return ResponseEntity.ok(service.getAllStations());
        }

        int pageNum = page != null ? Math.max(0, page) : 0;
        int pageSize = size != null ? Math.min(Math.max(size, 1), MAX_PAGE_SIZE) : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, resolveListSort(sort));
        Page<CoastalStationCospasSarsatResponse> pageResult = service.searchPaged(
                orgUnitId, operatingOrgId, provinceId, conditionStatus, approvalStatus,
                keyword, name, code, updatedFrom, updatedTo, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("totalElements", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("size", pageResult.getSize());
        response.put("number", pageResult.getNumber());

        if (includeCounts) {
            response.put("statusCounts", service.countByApprovalStatus(
                    orgUnitId, operatingOrgId, provinceId, conditionStatus, keyword, name, code, updatedFrom, updatedTo));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/counts")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Đếm số lượng bản ghi theo từng tab trạng thái phê duyệt")
    public ResponseEntity<Map<String, Long>> getCounts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID operatingOrgId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo) {
        return ResponseEntity.ok(service.countByApprovalStatus(
                orgUnitId, operatingOrgId, provinceId, conditionStatus, keyword, name, code, updatedFrom, updatedTo));
    }

    private static Sort resolveListSort(String sort) {
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "c.createdAt");
        if (sort == null || sort.isBlank()) {
            return defaultSort;
        }
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        // 1. Tên đài
        if ("name".equalsIgnoreCase(field) || "stationName".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN c.name IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(c.name)"))
                    .and(JpaSort.unsafe(direction, "LOWER(c.code)"))
                    .and(defaultSort);
        }

        // 2. Mã đài
        if ("code".equalsIgnoreCase(field) || "stationCode".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN c.code IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(c.code)"))
                    .and(JpaSort.unsafe(direction, "LOWER(c.name)"))
                    .and(defaultSort);
        }

        // 3. Đơn vị quản lý
        if ("orgUnitName".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN o.name IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(o.name)"))
                    .and(defaultSort);
        }

        // 4. Đơn vị khai thác
        if ("operatingOrgName".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN COALESCE(oo.name, oorg.name) IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(COALESCE(oo.name, oorg.name))"))
                    .and(defaultSort);
        }

        // 5. Địa điểm (Tỉnh/TP)
        if ("province".equalsIgnoreCase(field) || "provinceId".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN pv.id IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "pv.sortOrder"))
                    .and(JpaSort.unsafe(direction, "LOWER(c.name)"))
                    .and(defaultSort);
        }

        // 6. Cán bộ cập nhật
        if ("updatedInfo".equalsIgnoreCase(field) || "updatedByName".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN COALESCE(uu.fullName, uc.fullName) IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(COALESCE(uu.fullName, uc.fullName))"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "COALESCE(c.updatedAt, c.createdAt)"))
                    .and(defaultSort);
        }

        // 7. Cán bộ gửi duyệt
        if ("submittedInfo".equalsIgnoreCase(field) || "submittedByName".equalsIgnoreCase(field) || "submittedAt".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN us.fullName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(us.fullName)"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "c.submittedAt"))
                    .and(defaultSort);
        }

        // 8. Cán bộ duyệt C1
        if ("approvedLevel1Info".equalsIgnoreCase(field) || "approverLevel1Name".equalsIgnoreCase(field) || "approvedDateLevel1".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN ua1.fullName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(ua1.fullName)"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "c.approvedDateLevel1"))
                    .and(defaultSort);
        }

        // 9. Cán bộ duyệt C2
        if ("approvedLevel2Info".equalsIgnoreCase(field) || "approverLevel2Name".equalsIgnoreCase(field) || "approvedDateLevel2".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN ua2.fullName IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(ua2.fullName)"))
                    .and(JpaSort.unsafe(Sort.Direction.DESC, "c.approvedDateLevel2"))
                    .and(defaultSort);
        }

        // 10. Lý do từ chối
        if ("rejectionReason".equalsIgnoreCase(field)) {
            return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN c.rejectionReason IS NULL THEN 1 ELSE 0 END)")
                    .and(JpaSort.unsafe(direction, "LOWER(c.rejectionReason)"))
                    .and(defaultSort);
        }

        String property = SORTABLE_LIST_FIELDS.get(field);
        if (property == null) {
            return defaultSort;
        }
        String caseExpr = property.contains(".") ? property : ("c." + property);
        return JpaSort.unsafe(Sort.Direction.ASC, "(CASE WHEN " + caseExpr + " IS NULL THEN 1 ELSE 0 END)")
                .and(JpaSort.unsafe(direction, property))
                .and(defaultSort);
    }

    @GetMapping("/options")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Lấy danh sách chọn nhẹ Đài Cospas-Sarsat (chỉ APPROVED & OPERATIONAL)")
    public ResponseEntity<List<CoastalStationCospasSarsatOptionResponse>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(service.getOptions(orgUnitId));
    }

    @GetMapping("/list")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Lấy toàn bộ danh sách Đài Cospas-Sarsat (chưa xóa)")
    public ResponseEntity<List<CoastalStationCospasSarsat>> getAllStations() {
        return ResponseEntity.ok(service.getAllStations());
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Tìm kiếm Đài Cospas-Sarsat theo từ khóa đơn giản")
    public ResponseEntity<List<CoastalStationCospasSarsat>> searchStations(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchStations(keyword));
    }

    @GetMapping("/by-code/{code}")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    @Operation(summary = "Tìm Đài Cospas-Sarsat theo mã")
    public ResponseEntity<CoastalStationCospasSarsat> findByCode(@PathVariable String code) {
        return service.findByCode(code)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP ---

    @PostMapping("/{id}/submit")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:create', 'coastalstationcospassarsat:update', 'specialstation:create', 'specialstation:update', 'data:create', 'data:update')")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    public ResponseEntity<CoastalStationCospasSarsat> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:approvec1', 'specialstation:approvec1', 'data:approvec1')")
    @Operation(summary = "Phê duyệt vòng 1 (Cảng vụ / Chi cục)")
    public ResponseEntity<CoastalStationCospasSarsat> approveLevel1(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel1(id));
    }

    @PostMapping("/{id}/approve-l2")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:approvec2', 'specialstation:approvec2', 'data:approvec2')")
    @Operation(summary = "Phê duyệt vòng 2 (Cục Hàng hải)")
    public ResponseEntity<CoastalStationCospasSarsat> approveLevel2(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel2(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:approvec1', 'coastalstationcospassarsat:approvec2', 'specialstation:approvec1', 'specialstation:approvec2', 'data:approvec1', 'data:approvec2')")
    @Operation(summary = "Từ chối phê duyệt")
    public ResponseEntity<CoastalStationCospasSarsat> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = body != null && body.get("rejectionReason") != null
                ? body.get("rejectionReason").toString()
                : "Từ chối phê duyệt";
        return ResponseEntity.ok(service.reject(id, reason));
    }

    // Tương thích ngược với endpoint /approve cũ
    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:approvec1', 'coastalstationcospassarsat:approvec2', 'specialstation:approvec1', 'specialstation:approvec2', 'data:approvec1', 'data:approvec2')")
    public ResponseEntity<CoastalStationCospasSarsat> approveLegacy(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean approved = body == null || !Boolean.FALSE.equals(body.get("approved"));
        return ResponseEntity.ok(service.approveStation(id, approved));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:history', 'coastalstationcospassarsat:read', 'specialstation:history', 'specialstation:read', 'data:read')")
    @Operation(summary = "Xem lịch sử thay đổi của Đài Cospas-Sarsat")
    public ResponseEntity<List<CoastalStationCospasSarsatHistoryResponse>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        if (page == null && pageSize == null && keyword == null && fromDate == null && toDate == null) {
            return ResponseEntity.ok(service.getHistory(id));
        }
        return ResponseEntity.ok(service.getHistory(id, page, pageSize, keyword, fromDate, toDate));
    }

    // ── File đính kèm (Attachments) ──

    @PostMapping(value = "/{id}/attachments", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tài liệu đính kèm cho Đài Cospas-Sarsat")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:create', 'coastalstationcospassarsat:update', 'specialstation:create', 'specialstation:update', 'data:create', 'data:update', 'coastalstationcospassarsat:approvec2', 'specialstation:approvec2', 'data:approvec2')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationCospasSarsatAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<org.springframework.web.multipart.MultipartFile> files) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        List<CoastalStationCospasSarsatAttachmentResponse> uploaded = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @GetMapping("/{id}/attachments")
    @Operation(summary = "Lấy danh sách tài liệu đính kèm của Đài Cospas-Sarsat")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationCospasSarsatAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<CoastalStationCospasSarsatAttachmentResponse> list = service.listAttachments(id);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Danh sách tài liệu đính kèm", list));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @Operation(summary = "Xóa tài liệu đính kèm của Đài Cospas-Sarsat")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:update', 'specialstation:update', 'data:update', 'coastalstationcospassarsat:approvec2', 'specialstation:approvec2', 'data:approvec2')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @Operation(summary = "Tải xuống tài liệu đính kèm của Đài Cospas-Sarsat")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationcospassarsat:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = service.getAttachment(id, attId);
        java.nio.file.Path path = java.nio.file.Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        try {
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            try {
                contentType = java.nio.file.Files.probeContentType(path);
                if (contentType == null) contentType = "application/octet-stream";
            } catch (Exception ignored) {}

            String encodedFileName = java.net.URLEncoder.encode(attachment.getFileName(), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                    .body(resource);
        } catch (java.net.MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
