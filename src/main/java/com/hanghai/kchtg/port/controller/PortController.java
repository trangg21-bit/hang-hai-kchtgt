package com.hanghai.kchtg.port.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.port.*;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.service.PortApprovalService;
import com.hanghai.kchtg.port.service.PortService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.Authentication;
import java.util.UUID;

import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;

@RestController
@RequestMapping("/api/v1/ports")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class PortController {

    private final PortService portService;
    private final PortApprovalService portApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'port:create')")
    public ResponseEntity<ApiResponse<PortResponse>> create(
            @Valid @RequestBody CreatePortRequest request) {
        log.info("Creating Port: code={}", request.getPortCode());
        PortResponse response = portService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cảng biển thành công", response));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'port:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        log.info("Generating port code");
        String code = portService.generatePortCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã cảng thành công", Map.of("portCode", code)));
    }

    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<PortOptionResponse>>> getOptions() {
        log.info("Getting Port options list");
        List<PortOptionResponse> options = portService.getOptions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục cảng biển thành công", options));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<PortResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Port by id={}", id);
        PortResponse response = portService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng biển thành công", response));
    }

    @GetMapping
    @DataScope
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<Page<PortResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String portCode,
            @RequestParam(required = false) String portName,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) Integer portGroup,
            @RequestParam(required = false) Integer portClass,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        log.info(
                "Listing Ports: page={}, size={}, orgUnitId={}, search={}, portCode={}, portName={}, province={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, portCode, portName, province, operationalStatus, approvalStatus);
        Page<PortResponse> result = portService.findAll(
                page, size, orgUnitId, portCode, portName, province, operationalStatus, approvalStatus, portGroup,
                portClass, updatedFrom, updatedTo, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng biển thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'port:update')")
    public ResponseEntity<ApiResponse<PortResponse>> update(
            @Valid @RequestBody UpdatePortRequest request) {
        log.info("Updating Port: id={}", request.getId());
        PortResponse response = portService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cảng biển thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'port:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Port: id={}", id);
        portService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng biển thành công", null));
    }

    // ── Phê duyệt 2 cấp (approval-2-level-spec §3.2) ────────────────────────

    @PostMapping("/{id}/submit")
    @PreAuthorize("@auth.check(authentication, 'port:update')")
    public ResponseEntity<ApiResponse<Void>> submit(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        log.info("Submitting Port for approval: id={}, userId={}", id, userId);
        portApprovalService.submit(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt cảng biển thành công", null));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'port:approvec1')")
    public ResponseEntity<ApiResponse<Void>> approveC1(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        UUID userId = SecurityUtils.getCurrentUserId();
        log.info("Approving Port at level 1: id={}, userId={}", id, userId);
        portApprovalService.approveC1(id, reason, userId);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cảng vụ thành công", null));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'port:approvec2')")
    public ResponseEntity<ApiResponse<Void>> approveC2(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        UUID userId = SecurityUtils.getCurrentUserId();
        log.info("Approving Port at level 2: id={}, userId={}", id, userId);
        portApprovalService.approveC2(id, reason, userId);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", null));
    }

    /** Vòng bị từ chối do trạng thái hiện tại quyết định (xem PortApprovalService). */
    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.checkAny(authentication, 'port:approvec1', 'port:approvec2')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason) {
        UUID userId = SecurityUtils.getCurrentUserId();
        log.info("Rejecting Port: id={}, userId={}", id, userId);
        portApprovalService.reject(id, reason, userId);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng biển thành công", null));
    }

    @GetMapping("/history/all")
    @PreAuthorize("@auth.check(authentication, 'port:history')")
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all Port history");
        Object history = portApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử cảng biển thành công", history));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'port:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Port history: id={}", id);
        Object history = portApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng biển thành công", history));
    }

    // ── Child guard API (Feature 1) ────────────────────────────────────

    @GetMapping("/{id}/children")
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChildren(@PathVariable UUID id) {
        log.info("Getting children counts for Port id={}", id);
        Map<String, Object> counts = portService.getChildCounts(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin children của cảng biển thành công", counts));
    }

    // ── Soft-delete restore (Feature 2) ────────────────────────────────

    @PostMapping("/{id}/restore")
    @PreAuthorize("@auth.check(authentication, 'port:delete')")
    public ResponseEntity<ApiResponse<PortResponse>> restore(@PathVariable UUID id) {
        log.info("Restoring Port id={}", id);
        PortResponse response = portService.restore(id);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục cảng biển thành công", response));
    }

    // ── Attachment endpoints ────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.check(authentication, 'port:update')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = portService.uploadAttachmentsGeneric(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = portService.listAttachmentsGeneric(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.check(authentication, 'port:update')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        portService.deleteAttachmentGeneric(id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
