package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.lrit.*;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.service.CoastalStationLRITService;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stations/lrit")
@Validated
@RequiredArgsConstructor
@Tag(name = "LRIT Coastal Station", description = "Quản lý Đài thông tin nhận dạng và truy theo tầm xa (LRIT)")
@DataScope
public class CoastalStationLRITController {

    private final CoastalStationLRITService service;

    /** Trần số bản ghi mỗi trang cho endpoint danh sách. */
    private static final int MAX_PAGE_SIZE = 200;

    /**
     * Các cột được phép sắp xếp. Thuộc tính đến từ client nên phải qua danh sách
     * trắng — trước đây `sort=abcxyz,asc` làm cả màn trả HTTP 500.
     *
     * Cột tên hiển thị trỏ vào alias của LEFT JOIN trong
     * {@code CoastalStationLRITRepository.searchPaged}; các cột có cả trường mới
     * lẫn trường cũ (name/stationName, code/stationCode, orgUnitId/unitId) sắp
     * bằng COALESCE cho khớp đúng chữ hiển thị trên bảng.
     */
    private static final Map<String, String> SORTABLE_LIST_FIELDS = Map.ofEntries(
            Map.entry("name", "t.name"),
            Map.entry("stationName", "t.name"),
            Map.entry("code", "t.code"),
            Map.entry("stationCode", "t.code"),
            Map.entry("terminalId", "t.terminalId"),
            Map.entry("orgUnitName", "o.name"),
            Map.entry("orgUnitId", "t.orgUnitId"),
            Map.entry("operatingOrgName", "COALESCE(oo.name, oorg.name)"),
            Map.entry("operatingOrgId", "t.operatingOrgId"),
            Map.entry("province", "t.provinceId"),
            Map.entry("provinceId", "t.provinceId"),
            Map.entry("locationAddress", "t.locationAddress"),
            Map.entry("conditionStatus", "t.conditionStatus"),
            Map.entry("approvalStatus", "t.approvalStatus"),
            Map.entry("rejectionReason", "t.rejectionReason"),
            Map.entry("updatedByName", "uu.fullName"),
            Map.entry("submittedByName", "us.fullName"),
            Map.entry("approverLevel1Name", "ua1.fullName"),
            Map.entry("approverLevel2Name", "ua2.fullName"),
            // Bốn cột cán bộ trên bảng gộp tên + thời gian nên không có dataIndex;
            // client gửi lên chính KHÓA CỘT, thiếu bốn dòng này thì bấm sắp xếp
            // các cột đó không có tác dụng gì.
            Map.entry("updatedInfo", "uu.fullName"),
            Map.entry("submittedInfo", "us.fullName"),
            Map.entry("approvedLevel1Info", "ua1.fullName"),
            Map.entry("approvedLevel2Info", "ua2.fullName"),
            Map.entry("updatedAt", "t.updatedAt"),
            Map.entry("updatedDate", "t.updatedAt"),
            Map.entry("createdAt", "t.createdAt"));

    /**
     * Dùng {@link JpaSort#unsafe} vì thuộc tính đã qualify sẵn theo alias và có
     * trường hợp là biểu thức COALESCE — {@code Sort.by} từ chối cả hai. An toàn
     * vì giá trị luôn lấy từ danh sách trắng, không phải chuỗi thô của client.
     */
    private static Sort resolveListSort(Sort requested, String sortBy, String sortDir, String sort) {
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "t.createdAt");
        String field = null;
        Sort.Direction direction = Sort.Direction.DESC;

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            field = parts[0].trim();
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
                direction = Sort.Direction.ASC;
            }
        } else if (sortBy != null && !sortBy.isBlank()) {
            field = sortBy.trim();
            if ("asc".equalsIgnoreCase(sortDir)) {
                direction = Sort.Direction.ASC;
            }
        } else if (requested != null && requested.isSorted()) {
            Sort.Order order = requested.stream().findFirst().orElse(null);
            if (order != null) {
                field = order.getProperty().trim();
                direction = order.getDirection();
            }
        }

        if (field == null) {
            return defaultSort;
        }
        String property = SORTABLE_LIST_FIELDS.get(field);
        if (property == null) {
            return defaultSort;
        }
        return JpaSort.unsafe(direction, property).and(defaultSort);
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm phân trang danh sách Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<Page<CoastalStationLRITResponse>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            // Bộ lọc riêng theo Tên đài / Mã đài (khác `keyword` là tìm chung nhiều cột)
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) UUID operatingOrgId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        // Chặn trần số bản ghi mỗi trang: "size" đến từ client, không giới hạn thì
        // một request "size=100000" kéo cả bảng ra khỏi CSDL.
        int safeSize = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        Pageable sanitizedPageable = PageRequest.of(
                pageable.getPageNumber(), safeSize, resolveListSort(pageable.getSort(), sortBy, sortDir, sort));

        ConditionStatus parsedCondition = CoastalStationLRITService.parseConditionStatus(conditionStatus);
        Page<CoastalStationLRITResponse> results = service.searchPaged(
                orgUnitId, keyword, name, code, operatingOrgId, provinceId, parsedCondition, approvalStatus,
                updatedBy, updatedFrom, updatedTo, sanitizedPageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/counts")
    @Operation(summary = "Thống kê số lượng bản ghi theo tab trạng thái phê duyệt")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<Map<String, Long>> getCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String conditionStatus,
            // Số đếm tab phải áp cùng bộ lọc như danh sách, nếu không thì bật bộ lọc
            // nâng cao là số trên tab lệch hẳn với số dòng trong bảng.
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo) {
        ConditionStatus parsedCondition = CoastalStationLRITService.parseConditionStatus(conditionStatus);
        return ResponseEntity.ok(service.countByApprovalStatus(
                orgUnitId, keyword, name, code, parsedCondition, provinceId, updatedFrom, updatedTo));
    }

    @GetMapping("/options")
    @Operation(summary = "Lấy danh sách chọn nhanh các Đài LRIT đã duyệt")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<List<CoastalStationLRITResponse>> getOptions(@RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(service.findApprovedOptions(orgUnitId));
    }

    @GetMapping("/generate-code")
    @Operation(summary = "Tự sinh mã Đài LRIT (LRIT-xxxx)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:create', 'specialstation:create', 'data:create')")
    public ResponseEntity<Map<String, String>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(Map.of("code", code));
    }

    @GetMapping("/{id:[0-9a-fA-F-]{36}}")
    @Operation(summary = "Xem chi tiết Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<CoastalStationLRITResponse> getStationById(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.getStationById(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Đài LRIT (Lưu tạm, Gửi duyệt hoặc Phê duyệt)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:create', 'specialstation:create', 'data:create')")
    public ResponseEntity<CoastalStationLRITResponse> createStation(
            @RequestParam(defaultValue = "DRAFT") String action,
            @Valid @RequestBody CoastalStationLRITRequest request) {
        CoastalStationLRIT created = service.createStation(request);
        if ("SUBMIT".equalsIgnoreCase(action)) {
            created = service.submit(created.getId());
        } else if ("APPROVE".equalsIgnoreCase(action)) {
            created = service.submit(created.getId());
            if (created.getApprovalStatus() == ApprovalStatus.PENDING_APPROVAL) {
                created = service.approveLevel1(created.getId(), "Cấp Cục phê duyệt trực tiếp");
            }
            if (created.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
                created = service.approveLevel2(created.getId(), "Phê duyệt trực tiếp khi tạo mới");
            }
        }
        return ResponseEntity.ok(service.buildResponse(created));
    }

    @PostMapping("/create")
    @Operation(summary = "Create a new LRIT station (Legacy compatibility)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:create', 'specialstation:create', 'data:create')")
    public ResponseEntity<CoastalStationLRIT> createStationLegacy(@Valid @RequestBody CoastalStationLRITRequest request) {
        CoastalStationLRIT created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id:[0-9a-fA-F-]{36}}")
    @Operation(summary = "Cập nhật thông tin Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:update', 'specialstation:update', 'data:update')")
    public ResponseEntity<?> updateStation(
            @PathVariable UUID id,
            @RequestParam(required = false) String action,
            @Valid @RequestBody CoastalStationLRITUpdateRequest request) {
        CoastalStationLRIT updated = service.updateStation(id, request);
        if ("SUBMIT".equalsIgnoreCase(action)) {
            if (updated.getApprovalStatus() == ApprovalStatus.DRAFT
                    || updated.getApprovalStatus() == ApprovalStatus.REJECTED_LEVEL1
                    || updated.getApprovalStatus() == ApprovalStatus.REJECTED_LEVEL2) {
                updated = service.submit(updated.getId());
            }
        } else if ("APPROVE".equalsIgnoreCase(action)) {
            if (updated.getApprovalStatus() == ApprovalStatus.DRAFT
                    || updated.getApprovalStatus() == ApprovalStatus.REJECTED_LEVEL1
                    || updated.getApprovalStatus() == ApprovalStatus.REJECTED_LEVEL2) {
                updated = service.submit(updated.getId());
            }
            if (updated.getApprovalStatus() == ApprovalStatus.PENDING_APPROVAL) {
                updated = service.approveLevel1(updated.getId(), "Cấp Cục phê duyệt trực tiếp");
            }
            if (updated.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
                updated = service.approveLevel2(updated.getId(), "Phê duyệt trực tiếp khi chỉnh sửa");
            }
        }
        CoastalStationLRITResponse response = service.buildResponse(updated);
        return ResponseEntity.ok(response != null ? response : updated);
    }

    @DeleteMapping("/{id:[0-9a-fA-F-]{36}}")
    @Operation(summary = "Xóa mềm Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:delete', 'specialstation:delete', 'data:delete')")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:create', 'coastalstationlrit:update', 'specialstation:create', 'specialstation:update', 'data:create', 'data:update')")
    public ResponseEntity<CoastalStationLRITResponse> submit(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.submit(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/approve-c1")
    @Operation(summary = "Phê duyệt cấp 1 (Cảng vụ / Chi cục)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:approvec1', 'coastalstationlrit:approve', 'specialstation:approve', 'data:approvec1', 'data:approve')")
    public ResponseEntity<CoastalStationLRITResponse> approveLevel1(
            @PathVariable UUID id,
            @RequestBody(required = false) CoastalStationLRITApprovalRequest request) {
        CoastalStationLRIT entity = request == null || request.getContent() == null
                ? service.approveLevel1(id)
                : service.approveLevel1(id, request.getContent());
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/approve-c2")
    @Operation(summary = "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:approvec2', 'coastalstationlrit:approve', 'specialstation:approve', 'data:approvec2', 'data:approve')")
    public ResponseEntity<CoastalStationLRITResponse> approveLevel2(
            @PathVariable UUID id,
            @RequestBody(required = false) CoastalStationLRITApprovalRequest request) {
        CoastalStationLRIT entity = request == null || request.getContent() == null
                ? service.approveLevel2(id)
                : service.approveLevel2(id, request.getContent());
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt hồ sơ")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:approvec1', 'coastalstationlrit:approvec2', 'coastalstationlrit:approve', 'specialstation:approve', 'data:approvec1', 'data:approvec2', 'data:approve')")
    public ResponseEntity<?> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = null;
        if (body != null) {
            if (body.get("reason") != null) {
                reason = String.valueOf(body.get("reason"));
            } else if (body.get("rejectionReason") != null) {
                reason = String.valueOf(body.get("rejectionReason"));
            }
        }
        if (reason == null || reason.isBlank()) {
            reason = "Từ chối phê duyệt hồ sơ";
        }
        CoastalStationLRIT entity = service.rejectStation(id, reason, 1L);
        CoastalStationLRITResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response != null ? response : entity);
    }

    // Legacy adaptors for existing test cases
    @GetMapping("/list")
    @Operation(summary = "Get all active LRIT stations")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<List<CoastalStationLRIT>> getAllStations() {
        return ResponseEntity.ok(service.getAllStations());
    }

    @GetMapping("/search")
    @Operation(summary = "Search LRIT stations by keyword")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<List<CoastalStationLRIT>> searchStations(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchStations(keyword));
    }

    @GetMapping("/by-terminal/{terminalId}")
    @Operation(summary = "Find an LRIT station by terminal ID")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<CoastalStationLRIT> findByTerminalId(@PathVariable String terminalId) {
        Optional<CoastalStationLRIT> station = service.findByTerminalId(terminalId);
        return station.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-imo/{imoNumber}")
    @Operation(summary = "Find an LRIT station by IMO number")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<CoastalStationLRIT> findByImoNumber(@PathVariable String imoNumber) {
        Optional<CoastalStationLRIT> station = service.findByImoNumber(imoNumber);
        return station.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve an LRIT station (Legacy)")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:approve', 'coastalstationlrit:approvec1', 'coastalstationlrit:approvec2', 'specialstation:approve', 'data:approve')")
    public ResponseEntity<CoastalStationLRIT> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationLRITApprovalRequest request) {
        CoastalStationLRIT approved = service.approveStation(id, request.getApproved(), 1L);
        return ResponseEntity.ok(approved);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for an LRIT station")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<List<CoastalStationLRITHistoryResponse>> getHistory(
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
        return ResponseEntity.ok(service.getHistory(id, page, pageSize, keyword, fromDate, toDate));
    }

    // ── Attachment endpoints (InfrastructureAttachment, ref_type LRIT_STATION) ──

    @PostMapping(value = "/{id}/attachments", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tài liệu đính kèm cho Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:update', 'specialstation:update', 'data:update')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationLRITAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<org.springframework.web.multipart.MultipartFile> files) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        List<CoastalStationLRITAttachmentResponse> uploaded = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Tải lên tệp đính kèm thành công", uploaded));
    }

    @GetMapping("/{id}/attachments")
    @Operation(summary = "Lấy danh sách tài liệu đính kèm của Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<List<CoastalStationLRITAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<CoastalStationLRITAttachmentResponse> list = service.listAttachments(id);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Danh sách tài liệu đính kèm", list));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @Operation(summary = "Xóa tài liệu đính kèm của Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:update', 'specialstation:update', 'data:update')")
    public ResponseEntity<com.hanghai.kchtg.common.dto.ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(com.hanghai.kchtg.common.dto.ApiResponse.success("Xóa tài liệu đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @Operation(summary = "Tải xuống tài liệu đính kèm của Đài LRIT")
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationlrit:read', 'specialstation:read', 'data:read')")
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

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + (attachment.getFileName() != null ? attachment.getFileName().replace("\"", "") : "attachment") + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

