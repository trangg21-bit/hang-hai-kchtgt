package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.buoyberth.ApproveRequest;
import com.hanghai.kchtg.port.dto.buoyberth.AttachmentDto;
import com.hanghai.kchtg.port.dto.buoyberth.BuoyBerthResponse;
import com.hanghai.kchtg.port.dto.buoyberth.CreateBuoyBerthRequest;
import com.hanghai.kchtg.port.dto.buoyberth.HistoryEntry;
import com.hanghai.kchtg.port.dto.buoyberth.RejectRequest;
import com.hanghai.kchtg.port.dto.buoyberth.UpdateBuoyBerthRequest;
import com.hanghai.kchtg.port.service.BuoyBerthApprovalService;
import com.hanghai.kchtg.port.service.BuoyBerthService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.annotation.DataScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/buoy-berth")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class BuoyBerthController {

    private final BuoyBerthService buoyBerthService;
    private final BuoyBerthApprovalService buoyBerthApprovalService;

    @PostMapping
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<BuoyBerthResponse>> create(
            @Valid @RequestBody CreateBuoyBerthRequest request) {
        log.info("Creating BuoyBerth: name={}", request.getBuoyBerthName());
        BuoyBerthResponse response = buoyBerthService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới bến phao thành công", response));
    }

    @GetMapping("/generate-code")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating buoy berth code for portId={}", portId);
        String code = buoyBerthService.generateBuoyBerthCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã bến phao thành công", java.util.Map.of("buoyBerthCode", code)));
    }

    @GetMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<BuoyBerthResponse>> getById(@PathVariable UUID id) {
        log.info("Getting BuoyBerth by id={}", id);
        BuoyBerthResponse response = buoyBerthService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin bến phao thành công", response));
    }

    @GetMapping
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Page<BuoyBerthResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String buoyBerthCode,
            @RequestParam(required = false) String buoyBerthName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) UUID waterwayId,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        log.info(
                "Listing BuoyBerths: page={}, size={}, orgUnitId={}, search={}, buoyBerthCode={}, buoyBerthName={}, portId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, buoyBerthCode, buoyBerthName, portId, operationalStatus, approvalStatus);
        Page<BuoyBerthResponse> result = buoyBerthService.findAll(
                page, size, orgUnitId,
                search, buoyBerthCode, buoyBerthName, portId, waterwayId, classification,
                provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bến phao thành công", result));
    }

    @PutMapping
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<BuoyBerthResponse>> update(
            @Valid @RequestBody UpdateBuoyBerthRequest request) {
        log.info("Updating BuoyBerth: id={}", request.getId());
        BuoyBerthResponse response = buoyBerthService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bến phao thành công", response));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:delete')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting BuoyBerth: id={}", id);
        buoyBerthService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bến phao thành công", null));
    }

    @PostMapping("/{id}/approve")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving BuoyBerth: id={}, cap={}", id, request.getCap());
        buoyBerthApprovalService.approve(id, authentication.getName(), request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bến phao thành công", null));
    }

    @PostMapping("/{id}/reject")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting BuoyBerth: id={}, cap={}", id, request.getCap());
        buoyBerthApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối bến phao thành công", null));
    }

    @GetMapping("/history/all")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all BuoyBerth history");
        Object history = buoyBerthApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử bến phao thành công", history));
    }

    @GetMapping("/{id}/history")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
            @PathVariable UUID id,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        log.info("Getting BuoyBerth history: id={}", id);
        List<HistoryEntry> history = buoyBerthApprovalService.getHistory(id, page, pageSize, keyword, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử bến phao thành công", history));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = buoyBerthService.uploadAttachments("BUOY_BERTH", id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = buoyBerthService.listAttachments("BUOY_BERTH", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    // @PreAuthorize("@auth.check(authentication, 'buoyberth:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        buoyBerthService.deleteAttachment("BUOY_BERTH", id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
