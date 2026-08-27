package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.transferarea.ApproveRequest;
import com.hanghai.kchtg.port.dto.transferarea.AttachmentDto;
import com.hanghai.kchtg.port.dto.transferarea.CreateTransferAreaRequest;
import com.hanghai.kchtg.port.dto.transferarea.RejectRequest;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaResponse;
import com.hanghai.kchtg.port.dto.transferarea.UpdateTransferAreaRequest;
import com.hanghai.kchtg.port.repository.TransferAreaMooringWaterAreaRepository;
import com.hanghai.kchtg.port.service.TransferAreaApprovalService;
import com.hanghai.kchtg.port.service.TransferAreaService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transfer-area")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class TransferAreaController {

    private final TransferAreaService transferAreaService;
    private final TransferAreaApprovalService transferAreaApprovalService;
    private final TransferAreaMooringWaterAreaRepository transferAreaMooringWaterAreaRepository;

    @PostMapping
    // @PreAuthorize("@auth.check(authentication, 'transferarea:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<TransferAreaResponse>> create(
            @Valid @RequestBody CreateTransferAreaRequest request) {
        log.info("Creating TransferArea: name={}", request.getTransferAreaName());
        TransferAreaResponse response = transferAreaService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới khu chuyển tải thành công", response));
    }

    @GetMapping("/generate-code")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:create'")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating transfer area code for portId={}", portId);
        String code = transferAreaService.generateTransferAreaCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã khu chuyển tải thành công", java.util.Map.of("transferAreaCode", code)));
    }

    @GetMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<TransferAreaResponse>> getById(@PathVariable UUID id) {
        log.info("Getting TransferArea by id={}", id);
        TransferAreaResponse response = transferAreaService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin khu chuyển tải thành công", response));
    }

    @GetMapping
    // @PreAuthorize("@auth.check(authentication, 'transferarea:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Page<TransferAreaResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String transferAreaCode,
            @RequestParam(required = false) String transferAreaName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String operationalFunctions,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        log.info(
                "Listing TransferAreas: page={}, size={}, orgUnitId={}, search={}, transferAreaCode={}, transferAreaName={}, portId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, transferAreaCode, transferAreaName, portId, operationalStatus, approvalStatus);
        Page<TransferAreaResponse> result = transferAreaService.findAll(
                page, size, orgUnitId,
                search, transferAreaCode, transferAreaName, portId, provinceId, operationalFunctions,
                operationalStatus, approvalStatus, updatedFrom, updatedTo);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khu chuyển tải thành công", result));
    }

    @PutMapping
    // @PreAuthorize("@auth.check(authentication, 'transferarea:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<TransferAreaResponse>> update(
            @Valid @RequestBody UpdateTransferAreaRequest request) {
        log.info("Updating TransferArea: id={}", request.getId());
        TransferAreaResponse response = transferAreaService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khu chuyển tải thành công", response));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:delete')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting TransferArea: id={}", id);
        transferAreaService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khu chuyển tải thành công", null));
    }

    @PostMapping("/{id}/approve")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving TransferArea: id={}, cap={}", id, request.getCap());
        transferAreaApprovalService.approve(id, authentication.getName(), request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt khu chuyển tải thành công", null));
    }

    @PostMapping("/{id}/reject")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting TransferArea: id={}, cap={}", id, request.getCap());
        transferAreaApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối khu chuyển tải thành công", null));
    }

    @GetMapping("/history/all")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all TransferArea history");
        Object history = transferAreaApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử khu chuyển tải thành công", history));
    }

    @GetMapping("/{id}/history")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting TransferArea history: id={}", id);
        Object history = transferAreaApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử khu chuyển tải thành công", history));
    }

    @GetMapping("/{id}/children")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getChildren(@PathVariable UUID id) {
        long mooringWaterAreaCount = transferAreaMooringWaterAreaRepository.countByTransferAreaIdAndDeletedAtIsNull(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công",
                java.util.Map.of("mooringWaterAreaCount", mooringWaterAreaCount)));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("@auth.check(authentication, 'transferarea:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = transferAreaService.uploadAttachments("TRANSFER_AREA", id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = transferAreaService.listAttachments("TRANSFER_AREA", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    // @PreAuthorize("@auth.check(authentication, 'transferarea:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        transferAreaService.deleteAttachment("TRANSFER_AREA", id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
