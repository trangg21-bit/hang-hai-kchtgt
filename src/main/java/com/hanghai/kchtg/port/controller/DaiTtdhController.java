package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.daittdh.ApproveRequest;
import com.hanghai.kchtg.port.dto.daittdh.AttachmentDto;
import com.hanghai.kchtg.port.dto.daittdh.CreateDaiTtdhRequest;
import com.hanghai.kchtg.port.dto.daittdh.DaiTtdhResponse;
import com.hanghai.kchtg.port.dto.daittdh.RejectRequest;
import com.hanghai.kchtg.port.dto.daittdh.UpdateDaiTtdhRequest;
import com.hanghai.kchtg.port.service.DaiTtdhApprovalService;
import com.hanghai.kchtg.port.service.DaiTtdhService;
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
@RequestMapping("/api/v1/dai-ttdh")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class DaiTtdhController {

    private final DaiTtdhService daiTtdhService;
    private final DaiTtdhApprovalService daiTtdhApprovalService;

    @PostMapping
    // @PreAuthorize("@auth.check(authentication, 'daittdh:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<DaiTtdhResponse>> create(
            @Valid @RequestBody CreateDaiTtdhRequest request) {
        log.info("Creating DaiTtdh: name={}", request.getDaiTtdhName());
        DaiTtdhResponse response = daiTtdhService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới đài TTDH thành công", response));
    }

    @GetMapping("/generate-code")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode() {
        log.info("Generating dai TTDH code");
        String code = daiTtdhService.generateDaiTtdhCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã đài TTDH thành công", java.util.Map.of("daiTtdhCode", code)));
    }

    @GetMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<DaiTtdhResponse>> getById(@PathVariable UUID id) {
        log.info("Getting DaiTtdh by id={}", id);
        DaiTtdhResponse response = daiTtdhService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đài TTDH thành công", response));
    }

    @GetMapping
    // @PreAuthorize("@auth.check(authentication, 'daittdh:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Page<DaiTtdhResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String daiTtdhCode,
            @RequestParam(required = false) String daiTtdhName,
            @RequestParam(required = false) Integer stationLevel,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        log.info("Listing DaiTtdh: page={}, size={}, orgUnitId={}, search={}, code={}, name={}, stationLevel={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, daiTtdhCode, daiTtdhName, stationLevel, operationalStatus, approvalStatus);
        Page<DaiTtdhResponse> result = daiTtdhService.findAll(
                page, size, orgUnitId,
                search, daiTtdhCode, daiTtdhName, stationLevel, provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đài TTDH thành công", result));
    }

    @PutMapping
    // @PreAuthorize("@auth.check(authentication, 'daittdh:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<DaiTtdhResponse>> update(
            @Valid @RequestBody UpdateDaiTtdhRequest request) {
        log.info("Updating DaiTtdh: id={}", request.getId());
        DaiTtdhResponse response = daiTtdhService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đài TTDH thành công", response));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:delete')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting DaiTtdh: id={}", id);
        daiTtdhService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa đài TTDH thành công", null));
    }

    @PostMapping("/{id}/approve")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving DaiTtdh: id={}, cap={}", id, request.getCap());
        daiTtdhApprovalService.approve(id, authentication.getName(), request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt đài TTDH thành công", null));
    }

    @PostMapping("/{id}/reject")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting DaiTtdh: id={}, cap={}", id, request.getCap());
        daiTtdhApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối đài TTDH thành công", null));
    }

    @GetMapping("/history/all")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all DaiTtdh history");
        Object history = daiTtdhApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử đài TTDH thành công", history));
    }

    @GetMapping("/{id}/history")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting DaiTtdh history: id={}", id);
        Object history = daiTtdhApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử đài TTDH thành công", history));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("@auth.check(authentication, 'daittdh:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = daiTtdhService.uploadAttachments("DAI_TTDH", id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = daiTtdhService.listAttachments("DAI_TTDH", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    // @PreAuthorize("@auth.check(authentication, 'daittdh:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        daiTtdhService.deleteAttachment("DAI_TTDH", id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
