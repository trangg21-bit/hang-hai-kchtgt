package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.dryport.CreateDryPortRequest;
import com.hanghai.kchtg.port.dto.dryport.DryPortResponse;
import com.hanghai.kchtg.port.dto.dryport.UpdateDryPortRequest;
import com.hanghai.kchtg.port.service.DryPortApprovalService;
import com.hanghai.kchtg.port.service.DryPortService;
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
import com.hanghai.kchtg.security.annotation.DataScope;

@RestController
@RequestMapping("/api/v1/dry-ports")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class DryPortController {

    private final DryPortService dryPortService;
    private final DryPortApprovalService dryPortApprovalService;

    // ── Generate code ──────────────────────────────────────────

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'dryport:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        log.info("Generating dry port code");
        String code = dryPortService.generateCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã cảng cạn thành công", Map.of("code", code)));
    }

    // ── CRUD ───────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'dryport:create')")
    public ResponseEntity<ApiResponse<DryPortResponse>> create(
            @Valid @RequestBody CreateDryPortRequest request) {
        log.info("Creating DryPort: code={}, action={}", request.getDryPortCode(), request.getSaveAction());
        DryPortResponse response = dryPortService.create(request);
        String msg = "draft".equals(request.getSaveAction()) ? "Đã lưu nháp"
                : "approve".equals(request.getSaveAction()) ? "Đã tạo và phê duyệt thành công"
                        : "Tạo mới cảng cạn thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dryport:read')")
    public ResponseEntity<ApiResponse<DryPortResponse>> getById(@PathVariable UUID id) {
        log.info("Getting DryPort by id={}", id);
        DryPortResponse response = dryPortService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng cạn thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'dryport:read')")
    public ResponseEntity<ApiResponse<Page<DryPortResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Integer portStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String transportCorridor) {
        log.info(
                "Listing DryPorts: page={}, size={}, orgUnitId={}, provinceId={}, search={}, status={}, approvalStatus={}, region={}, portStatus={}, updatedFrom={}, updatedTo={}, code={}, transportCorridor={}",
                page, size, orgUnitId, provinceId, search, status, approvalStatus, region, portStatus, updatedFrom, updatedTo, code, transportCorridor);
        Page<DryPortResponse> result = dryPortService.findAll(page, size, orgUnitId, provinceId, search, status,
                approvalStatus, region, portStatus, updatedFrom, updatedTo, code, transportCorridor);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng cạn thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'dryport:update')")
    public ResponseEntity<ApiResponse<DryPortResponse>> update(
            @Valid @RequestBody UpdateDryPortRequest request) {
        log.info("Updating DryPort: id={}, action={}", request.getId(), request.getSaveAction());
        DryPortResponse response = dryPortService.update(request);
        String msg = "submit".equals(request.getSaveAction()) ? "Đã gửi phê duyệt"
                : "approve".equals(request.getSaveAction()) ? "Đã cập nhật và phê duyệt thành công"
                        : "Cập nhật cảng cạn thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'dryport:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting DryPort: id={}", id);
        dryPortService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng cạn thành công", null));
    }

    // ── Soft-delete restore (giống cảng biển) ──────────────────

    @PostMapping("/{id}/restore")
    @PreAuthorize("@auth.check(authentication, 'dryport:delete')")
    public ResponseEntity<ApiResponse<DryPortResponse>> restore(@PathVariable UUID id) {
        log.info("Restoring DryPort id={}", id);
        DryPortResponse response = dryPortService.restore(id);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục cảng cạn thành công", response));
    }

    // ── Submit (from list page F-083) ──────────────────────────

    @PutMapping("/{id}/submit")
    @PreAuthorize("@auth.check(authentication, 'dryport:update')")
    public ResponseEntity<ApiResponse<DryPortResponse>> submit(@PathVariable UUID id) {
        log.info("Submitting DryPort for approval: id={}", id);
        DryPortResponse response = dryPortService.submit(id);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi phê duyệt", response));
    }

    // ── Approval ───────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'dryport:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving DryPort: id={}, userId={}", id, userId);
        dryPortApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cảng cạn thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'dryport:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting DryPort: id={}, userId={}", id, userId);
        dryPortApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng cạn thành công", null));
    }

    // ── History ────────────────────────────────────────────────

    @GetMapping("/history/all")
    @PreAuthorize("@auth.check(authentication, 'dryport:history')")
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all DryPort history");
        Object history = dryPortApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử cảng cạn thành công", history));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'dryport:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting DryPort history: id={}", id);
        Object history = dryPortApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng cạn thành công", history));
    }

    // ── Attachments ────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.check(authentication, 'dryport:update')")
    public ResponseEntity<ApiResponse<?>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("Không có file"));
        UUID userId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
        dryPortService.uploadAttachments(id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên thành công", null));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.check(authentication, 'dryport:update')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable UUID id, @PathVariable UUID attId) {
        dryPortService.deleteAttachment(id, attId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file thành công", null));
    }
}
