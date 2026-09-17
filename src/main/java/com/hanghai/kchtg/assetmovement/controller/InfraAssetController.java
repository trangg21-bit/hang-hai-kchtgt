package com.hanghai.kchtg.assetmovement.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.service.InfraAssetService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;

@RestController
@RequestMapping("/api/v1/asset/infra-assets")
@DataScope
public class InfraAssetController {

    private final InfraAssetService infraAssetService;

    public InfraAssetController(InfraAssetService infraAssetService) {
        this.infraAssetService = infraAssetService;
    }

    /**
     * Whitelist các field DB thực sự có trong bảng infra_assets.
     */
    public static final Set<String> SORTABLE_DB_FIELDS = Set.of(
            "id", "createdAt", "updatedAt", "createdBy", "updatedBy",
            "assetCode", "assetName", "assetType", "types",
            "parentOrgUnitId", "orgUnitId", "usingOrgUnitId",
            "berthId", "transferAreaId", "stormShelterId", "buoyBerthId", "pierId",
            "anchorageId", "beaconStationId", "dikeRevetmentId", "buoyId", "buoyStationId", "navigationChannelId",
            "stationId", "lritStationId", "ttdhStationId", "inmarsatStationId", "cospasSarsatStationId", "ttxlttStationId", "dryPortId",
            "barcode", "assetCondition", "usageStatus", "assetGroup", "assetSubgroup",
            "address", "origin", "quantity", "quantityUnit", "model", "serialNumber",
            "countryOfOrigin", "manufacturer", "constructionYear", "useDate",
            "landArea", "floorArea", "assetLocation", "attachmentName", "declarationDate",
            "depreciationRate", "assignmentDecisionNumber", "depreciationStartDate",
            "depreciationMonths", "depreciationEndDate", "monthlyDepreciation", "disposalMethod",
            "originalValue", "accumulatedDepreciation", "remainingValue", "status", "approvalStatus",
            "submittedBy", "submittedAt",
            "portAuthorityApprovedBy", "portAuthorityApprovedAt", "portAuthorityApprovalContent",
            "departmentApprovedBy", "departmentApprovedAt", "departmentApprovalContent"
    );

    private static Sort resolveSort(String sortBy, String sortDir) {
        String field = (sortBy != null && SORTABLE_DB_FIELDS.contains(sortBy.trim()))
                ? sortBy.trim()
                : "createdAt";
        return "ASC".equalsIgnoreCase(sortDir)
                ? Sort.by(field).ascending()
                : Sort.by(field).descending();
    }

    @PostMapping
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:create', 'berth:create')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> create(
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = infraAssetService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản đã được tăng", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:read', 'berth:read', 'data:read')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> getById(
            @PathVariable UUID id) {
        InfraAssetResponse response = infraAssetService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:read', 'berth:read', 'data:read')")
    public ResponseEntity<ApiResponse<Page<InfraAssetResponse>>> findAll(
            @RequestParam(required = false) String assetCode,
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) UUID parentOrgUnitId,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID usingOrgUnitId,
            @RequestParam(required = false) UUID berthId,
            @RequestParam(required = false) UUID lritStationId,
            @RequestParam(required = false) UUID ttdhStationId,
            @RequestParam(required = false) UUID inmarsatStationId,
            @RequestParam(required = false) UUID cospasSarsatStationId,
            @RequestParam(required = false) UUID ttxlttStationId,
            @RequestParam(required = false) UUID stationId,
            @RequestParam(required = false) UUID dryPortId,
            @RequestParam(required = false) UUID transferAreaId,
            @RequestParam(required = false) UUID stormShelterId,
            @RequestParam(required = false) UUID buoyBerthId,
            @RequestParam(required = false) UUID pierId,
            @RequestParam(required = false) UUID anchorageId,
            @RequestParam(required = false) UUID beaconStationId,
            @RequestParam(required = false) UUID dikeRevetmentId,
            @RequestParam(required = false) UUID buoyId,
            @RequestParam(required = false) UUID buoyStationId,
            @RequestParam(required = false) UUID navigationChannelId,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) InfraAssetType assetType,
            @RequestParam(required = false) String assetCondition,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) LocalDate updatedFrom,
            @RequestParam(required = false) LocalDate updatedTo,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sortBy, sortDir));
        Page<InfraAssetResponse> result = infraAssetService.findAll(
                assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                berthId, lritStationId, ttdhStationId, inmarsatStationId, cospasSarsatStationId,
                ttxlttStationId, stationId, dryPortId,
                transferAreaId, stormShelterId, buoyBerthId, pierId, anchorageId, beaconStationId, dikeRevetmentId, buoyId, buoyStationId, navigationChannelId,
                types, assetType, assetCondition,
                approvalStatus, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:update', 'berth:update')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = infraAssetService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:delete', 'berth:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        infraAssetService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đã được xóa", null));
    }

    // ── Approval endpoints ────────────────────────────────────────────────

    @PostMapping("/{id}/submit")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> submit(@PathVariable UUID id) {
        InfraAssetResponse response = infraAssetService.submit(id);
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", response));
    }

    @PostMapping(value = {"/{id}/approve-c1", "/{id}/approve-l1", "/{id}/approve/c1"})
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> approveC1(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String content = body != null ? body.getOrDefault("content", body.get("reason")) : null;
        InfraAssetResponse response = infraAssetService.approveC1(id, content);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cảng vụ/Chi cục thành công", response));
    }

    @PostMapping(value = {"/{id}/reject-c1", "/{id}/reject-l1", "/{id}/reject/c1"})
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> rejectC1(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", body.get("content")) : null;
        InfraAssetResponse response = infraAssetService.rejectC1(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cấp Cảng vụ/Chi cục thành công", response));
    }

    @PostMapping(value = {"/{id}/approve-c2", "/{id}/approve-l2", "/{id}/approve/c2"})
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> approveC2(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String content = body != null ? body.getOrDefault("content", body.get("reason")) : null;
        InfraAssetResponse response = infraAssetService.approveC2(id, content);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", response));
    }

    @PostMapping(value = {"/{id}/reject-c2", "/{id}/reject-l2", "/{id}/reject/c2"})
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> rejectC2(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", body.get("content")) : null;
        InfraAssetResponse response = infraAssetService.rejectC2(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cấp Cục thành công", response));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:read', 'berth:read', 'data:read')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        Object history = infraAssetService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử tài sản thành công", history));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:update', 'infraasset:create', 'berth:update')")
    public ResponseEntity<ApiResponse<List<InfraAssetAttachmentResponse>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<InfraAssetAttachmentResponse> result = infraAssetService.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:read', 'berth:read', 'data:read')")
    public ResponseEntity<ApiResponse<List<InfraAssetAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<InfraAssetAttachmentResponse> result = infraAssetService.listAttachments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:update', 'berth:update')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        infraAssetService.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.checkAny(authentication, 'infraasset:manage', 'infraasset:read', 'berth:read', 'data:read')")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        Attachment attachment = infraAssetService.getAttachment(id, attId);
        Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(path);
        String contentType;
        try {
            contentType = Files.probeContentType(path);
        } catch (java.io.IOException ignored) {
            contentType = null;
        }
        MediaType mediaType = contentType == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + attachment.getFileName().replace("\"", "") + "\"")
                .body(resource);
    }
}
