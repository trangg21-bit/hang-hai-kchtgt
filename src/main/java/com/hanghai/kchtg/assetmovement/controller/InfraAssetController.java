package com.hanghai.kchtg.assetmovement.controller;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.service.InfraAssetService;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/asset/infra-assets")
@RequiredArgsConstructor
@DataScope
public class InfraAssetController {

    private final InfraAssetService infraAssetService;

    /**
     * Whitelist các field DB thực sự có trong bảng infra_assets.
     */
    private static final Set<String> SORTABLE_DB_FIELDS = Set.of(
            "id", "createdAt", "updatedAt", "createdBy", "updatedBy",
            "assetCode", "assetName", "assetType",
            "parentOrgUnitId", "orgUnitId", "usingOrgUnitId",
            "berthId", "transferAreaId", "stormShelterId", "buoyBerthId", "pierId",
            "anchorageId", "beaconStationId", "dikeRevetmentId", "buoyId", "buoyStationId", "navigationChannelId",
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
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> create(
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = infraAssetService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản đã được tăng", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> getById(
            @PathVariable UUID id) {
        InfraAssetResponse response = infraAssetService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Page<InfraAssetResponse>>> findAll(
            @RequestParam(required = false) String assetCode,
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) UUID parentOrgUnitId,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID usingOrgUnitId,
            @RequestParam(required = false) UUID berthId,
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
        Page<InfraAssetResponse> result = infraAssetService.findAll(assetCode, assetName, parentOrgUnitId, orgUnitId,
                usingOrgUnitId, berthId, transferAreaId, stormShelterId, buoyBerthId, pierId, anchorageId, beaconStationId, dikeRevetmentId, buoyId, buoyStationId, navigationChannelId,
                assetType, assetCondition,
                approvalStatus, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<InfraAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody InfraAssetRequest request) {
        InfraAssetResponse response = infraAssetService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đã được cập nhật", response));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        infraAssetService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản đã được xóa", null));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
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
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<List<InfraAssetAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<InfraAssetAttachmentResponse> result = infraAssetService.listAttachments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        infraAssetService.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
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
        } catch (Exception ignored) {
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
