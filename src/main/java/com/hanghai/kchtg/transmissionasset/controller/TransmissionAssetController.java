package com.hanghai.kchtg.transmissionasset.controller;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.transmissionasset.dto.*;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetAdjustment;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetExploitation;
import com.hanghai.kchtg.transmissionasset.service.TransmissionAssetService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/asset/transmission-assets")
@RequiredArgsConstructor
@DataScope
public class TransmissionAssetController {

    private final TransmissionAssetService service;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<TransmissionAssetResponse>> create(
            @RequestBody TransmissionAssetRequest request) {
        TransmissionAssetResponse response = service.create(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Tài sản HT truyền dẫn đã được tạo", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<TransmissionAssetResponse>> getById(
            @PathVariable UUID id) {
        TransmissionAssetResponse response = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private static final java.util.Set<String> SORTABLE_FIELDS = java.util.Set.of(
            "id", "assetCode", "assetName", "parentOrgUnitId", "orgUnitId", "usingOrgUnitId",
            "transmissionId", "assetCondition", "usageStatus", "assetGroup", "assetSubgroup",
            "address", "origin", "quantity", "quantityUnit", "model", "serialNumber",
            "countryOfOrigin", "manufacturer", "constructionYear", "useDate", "landArea",
            "floorArea", "assetLocation", "declarationDate", "depreciationRate",
            "assignmentDecisionNumber", "depreciationStartDate", "depreciationMonths",
            "depreciationEndDate", "monthlyDepreciation", "disposalMethod", "originalValue",
            "accumulatedDepreciation", "remainingValue", "approvalStatus", "submittedBy",
            "submittedAt", "portAuthorityApprovedBy", "portAuthorityApprovedAt",
            "portAuthorityApprovalContent", "departmentApprovedBy", "departmentApprovedAt",
            "departmentApprovalContent", "createdAt", "updatedAt"
    );

    private static Sort resolveSort(String sortBy, String sortDir) {
        String field = (sortBy != null && SORTABLE_FIELDS.contains(sortBy.trim()))
                ? sortBy.trim()
                : "createdAt";
        return "ASC".equalsIgnoreCase(sortDir)
                ? Sort.by(field).ascending()
                : Sort.by(field).descending();
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Page<TransmissionAssetResponse>>> findAll(
            @RequestParam(required = false) String assetCode,
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) UUID parentOrgUnitId,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID usingOrgUnitId,
            @RequestParam(required = false) UUID transmissionId,
            @RequestParam(required = false) String assetCondition,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String assetType,
            @RequestParam(required = false) LocalDate updatedFrom,
            @RequestParam(required = false) LocalDate updatedTo,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sortBy, sortDir));
        Page<TransmissionAssetResponse> result = service.findAll(
                assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                transmissionId, assetCondition, approvalStatus, assetType, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<TransmissionAssetResponse>> update(
            @PathVariable UUID id,
            @RequestBody TransmissionAssetRequest request) {
        TransmissionAssetResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tài sản HT truyền dẫn đã được cập nhật", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tài sản HT truyền dẫn đã được xóa", null));
    }

    @GetMapping("/{id}/exploitations")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<List<TransmissionAssetExploitation>>> getExploitations(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getExploitations(id)));
    }

    @PostMapping("/{id}/exploitations")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<TransmissionAssetExploitation>> addExploitation(
            @PathVariable UUID id,
            @RequestBody TransmissionExploitationRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.success("Đã ghi nhận khai thác tài sản", service.addExploitation(id, request)));
    }

    @GetMapping("/{id}/adjustments")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<List<TransmissionAssetAdjustment>>> getAdjustments(
            @PathVariable UUID id,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(ApiResponse.success(service.getAdjustments(id, type)));
    }

    @PostMapping("/{id}/adjustments")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<TransmissionAssetAdjustment>> addAdjustment(
            @PathVariable UUID id,
            @RequestBody TransmissionAdjustmentRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.success("Đã gửi yêu cầu điều chỉnh nguyên giá", service.addAdjustment(id, request)));
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
        List<InfraAssetAttachmentResponse> result = service.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<List<InfraAssetAttachmentResponse>>> listAttachments(
            @PathVariable UUID id) {
        List<InfraAssetAttachmentResponse> result = service.listAttachments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        service.deleteAttachment(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.check(authentication, 'infraasset:manage')")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        Attachment attachment = service.getAttachment(id, attId);
        Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(path);
        String downloadName = attachment.getFileName() != null ? attachment.getFileName() : "attachment";
        MediaType mediaType = org.springframework.http.MediaTypeFactory.getMediaType(downloadName)
                .orElseGet(() -> {
                    String ct = null;
                    try { ct = Files.probeContentType(path); } catch (Exception ignored) {}
                    return ct != null ? MediaType.parseMediaType(ct) : MediaType.APPLICATION_OCTET_STREAM;
                });
        String encodedFileName = java.net.URLEncoder.encode(downloadName, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + downloadName.replace("\"", "") + "\"; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }
}
