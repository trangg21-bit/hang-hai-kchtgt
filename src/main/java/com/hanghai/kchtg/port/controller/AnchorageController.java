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
import java.util.UUID;

import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;

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
    // @PreAuthorize("@auth.check(authentication, 'anchorage:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<AnchorageResponse>> create(
            @Valid @RequestBody CreateAnchorageRequest request) {
        log.info("Creating Anchorage: name={}", request.getAnchorageName());
        AnchorageResponse response = anchorageService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới khu neo đậu thành công", response));
    }

    @GetMapping("/generate-code")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating anchorage code for portId={}", portId);
        String code = anchorageService.generateAnchorageCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã khu neo đậu thành công", java.util.Map.of("anchorageCode", code)));
    }

    @GetMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<AnchorageResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Anchorage by id={}", id);
        AnchorageResponse response = anchorageService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin khu neo đậu thành công", response));
    }

    @GetMapping
    // @PreAuthorize("@auth.check(authentication, 'anchorage:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
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
            @RequestParam(required = false) String updatedTo) {
        log.info(
                "Listing Anchorages: page={}, size={}, orgUnitId={}, search={}, anchorageCode={}, anchorageName={}, portId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, anchorageCode, anchorageName, portId, operationalStatus, approvalStatus);
        Page<AnchorageResponse> result = anchorageService.findAll(
                page, size, orgUnitId,
                search, anchorageCode, anchorageName, portId, navigationChannelId, buoyStationId, provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khu neo đậu thành công", result));
    }

    @PutMapping
    // @PreAuthorize("@auth.check(authentication, 'anchorage:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<AnchorageResponse>> update(
            @Valid @RequestBody UpdateAnchorageRequest request) {
        log.info("Updating Anchorage: id={}", request.getId());
        AnchorageResponse response = anchorageService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khu neo đậu thành công", response));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:delete')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Anchorage: id={}", id);
        anchorageService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khu neo đậu thành công", null));
    }

    @PostMapping("/{id}/approve")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving Anchorage: id={}, cap={}", id, request.getCap());
        anchorageApprovalService.approve(id, authentication.getName(), request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt khu neo đậu thành công", null));
    }

    @PostMapping("/{id}/reject")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting Anchorage: id={}, cap={}", id, request.getCap());
        anchorageApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối khu neo đậu thành công", null));
    }

    @GetMapping("/history/all")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all Anchorage history");
        Object history = anchorageApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử khu neo đậu thành công", history));
    }

    @GetMapping("/{id}/history")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Anchorage history: id={}", id);
        Object history = anchorageApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử khu neo đậu thành công", history));
    }

    @GetMapping("/{id}/children")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getChildren(@PathVariable UUID id) {
        long mooringWaterAreaCount = mooringWaterAreaRepository.countByAnchorageIdAndDeletedAtIsNull(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công",
                java.util.Map.of("mooringWaterAreaCount", mooringWaterAreaCount)));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("@auth.check(authentication, 'anchorage:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = anchorageService.uploadAttachments("ANCHORAGE", id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = anchorageService.listAttachments("ANCHORAGE", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    // @PreAuthorize("@auth.check(authentication, 'anchorage:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN ANCHORAGE
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        anchorageService.deleteAttachment("ANCHORAGE", id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
