package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.anchorage.AnchorageResponse;
import com.hanghai.kchtg.port.dto.anchorage.ApproveRequest;
import com.hanghai.kchtg.port.dto.anchorage.AttachmentDto;
import com.hanghai.kchtg.port.dto.anchorage.CreateAnchorageRequest;
import com.hanghai.kchtg.port.dto.anchorage.RejectRequest;
import com.hanghai.kchtg.port.dto.anchorage.UpdateAnchorageRequest;
import com.hanghai.kchtg.port.service.AnchorageApprovalService;
import com.hanghai.kchtg.port.service.AnchorageService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/anchorage")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class AnchorageController {

    private final AnchorageService anchorageService;
    private final AnchorageApprovalService anchorageApprovalService;
    private final com.hanghai.kchtg.port.repository.MooringWaterAreaRepository mooringWaterAreaRepository;

    @PostMapping
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:create')")
    public ResponseEntity<ApiResponse<AnchorageResponse>> create(
            @Valid @RequestBody CreateAnchorageRequest request) {
        log.info("Creating Anchorage: name={}", request.getAnchorageName());
        AnchorageResponse response = anchorageService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới khu neo đậu thành công", response));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:create', 'anchorage:read')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating anchorage code for portId={}", portId);
        String code = anchorageService.generateAnchorageCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã khu neo đậu thành công", Map.of("anchorageCode", code)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:read')")
    public ResponseEntity<ApiResponse<AnchorageResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Anchorage by id={}", id);
        AnchorageResponse response = anchorageService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin khu neo đậu thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:read')")
    public ResponseEntity<ApiResponse<Page<AnchorageResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String anchorageCode,
            @RequestParam(required = false) String anchorageName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) UUID navigationChannelId,
            @RequestParam(required = false) UUID buoyStationId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo,
            @RequestParam(required = false) Boolean isDeleted) {
        log.info(
                "Listing Anchorages: page={}, size={}, orgUnitId={}, search={}, anchorageCode={}, anchorageName={}, portId={}, status={}, approvalStatus={}, isDeleted={}",
                page, size, orgUnitId, search, anchorageCode, anchorageName, portId, operationalStatus, approvalStatus, isDeleted);
        Page<AnchorageResponse> result = anchorageService.findAll(
                page, size, orgUnitId,
                search, anchorageCode, anchorageName, portId, navigationChannelId, buoyStationId, provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo, isDeleted);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khu neo đậu thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:update', 'anchorage:approvec2')")
    public ResponseEntity<ApiResponse<AnchorageResponse>> update(
            @Valid @RequestBody UpdateAnchorageRequest request) {
        log.info("Updating Anchorage: id={}", request.getId());
        AnchorageResponse response = anchorageService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khu neo đậu thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Anchorage: id={}", id);
        anchorageService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khu neo đậu thành công", null));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:update', 'anchorage:create')")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String content = body != null ? body.get("content") : null;
        log.info("Submitting Anchorage for approval: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        anchorageApprovalService.submit(id, content, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt khu neo đậu thành công", null));
    }

    @PostMapping(value = {"/{id}/approve/c1", "/{id}/approvec1"})
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:approvec1')")
    public ResponseEntity<ApiResponse<Void>> approveC1(
            @PathVariable UUID id,
            @RequestBody(required = false) ApproveRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String content = request != null && request.getContent() != null ? request.getContent() : reason;
        log.info("Approving Anchorage C1: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        anchorageApprovalService.approve(id, authentication != null ? authentication.getName() : null, "CANG_VU", content);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", null));
    }

    @PostMapping(value = {"/{id}/approve/c2", "/{id}/approvec2", "/{id}/approve-l2"})
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:approvec2')")
    public ResponseEntity<ApiResponse<Void>> approveC2(
            @PathVariable UUID id,
            @RequestBody(required = false) ApproveRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String content = request != null && request.getContent() != null ? request.getContent() : reason;
        log.info("Approving Anchorage C2: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        anchorageApprovalService.approve(id, authentication != null ? authentication.getName() : null, "CUC", content);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", null));
    }

    @PostMapping(value = {"/{id}/reject/c1", "/{id}/rejectc1"})
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:approvec1')")
    public ResponseEntity<ApiResponse<Void>> rejectC1(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String lyDo = request != null && request.getLyDo() != null ? request.getLyDo() : reason;
        log.info("Rejecting Anchorage C1: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        anchorageApprovalService.reject(id, authentication != null ? authentication.getName() : null, "CANG_VU", lyDo);
        return ResponseEntity.ok(ApiResponse.success("Từ chối phê duyệt cấp Chi cục thành công", null));
    }

    @PostMapping(value = {"/{id}/reject/c2", "/{id}/rejectc2"})
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:approvec2')")
    public ResponseEntity<ApiResponse<Void>> rejectC2(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String lyDo = request != null && request.getLyDo() != null ? request.getLyDo() : reason;
        log.info("Rejecting Anchorage C2: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        anchorageApprovalService.reject(id, authentication != null ? authentication.getName() : null, "CUC", lyDo);
        return ResponseEntity.ok(ApiResponse.success("Từ chối phê duyệt cấp Cục thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:approvec1', 'anchorage:approvec2')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving Anchorage: id={}, cap={}", id, request.getCap());
        anchorageApprovalService.approve(id, authentication != null ? authentication.getName() : null, request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt khu neo đậu thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:approvec1', 'anchorage:approvec2')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String cap = request != null ? request.getCap() : null;
        String lyDo = request != null && request.getLyDo() != null ? request.getLyDo() : reason;
        log.info("Rejecting Anchorage: id={}, cap={}, reason={}", id, cap, lyDo);
        anchorageApprovalService.reject(id, authentication != null ? authentication.getName() : null, cap, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Từ chối khu neo đậu thành công", null));
    }

    @GetMapping("/history/all")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:history', 'anchorage:read', 'data:read')")
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all Anchorage history");
        Object history = anchorageApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử khu neo đậu thành công", history));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:history', 'anchorage:read', 'data:read')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Anchorage history: id={}", id);
        Object history = anchorageApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử khu neo đậu thành công", history));
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:read')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getChildren(@PathVariable UUID id) {
        long mooringWaterAreaCount = mooringWaterAreaRepository.countByAnchorageIdAndDeletedAtIsNull(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công",
                Map.of("mooringWaterAreaCount", mooringWaterAreaCount)));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:update')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "skipHistory", required = false, defaultValue = "false") boolean skipHistory,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = anchorageService.uploadAttachments("ANCHORAGE", id, files, userId, skipHistory);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:read')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = anchorageService.listAttachments("ANCHORAGE", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:update')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            @RequestParam(value = "skipHistory", required = false, defaultValue = "false") boolean skipHistory,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        anchorageService.deleteAttachment("ANCHORAGE", id, attId, userId, skipHistory);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.checkAny(authentication, 'anchorage:manage', 'anchorage:read')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        com.hanghai.kchtg.port.entity.Attachment attachment = anchorageService.getAttachment("ANCHORAGE", id, attId);
        java.nio.file.Path path = java.nio.file.Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!java.nio.file.Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(path);
        String contentType;
        try {
            contentType = java.nio.file.Files.probeContentType(path);
        } catch (Exception ignored) {
            contentType = null;
        }
        MediaType mediaType = contentType == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + attachment.getFileName().replace("\"", "") + "\"")
                .body(resource);
    }
}
