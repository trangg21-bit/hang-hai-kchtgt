package com.hanghai.kchtg.vtsassist.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import org.springframework.format.annotation.DateTimeFormat;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.SubmitContentRequest;
import com.hanghai.kchtg.vtsassist.dto.ApprovalRequest;
import com.hanghai.kchtg.vtsassist.dto.VtsAssistResponse;
import com.hanghai.kchtg.vtsassist.dto.VtsAssistOptionResponse;
import com.hanghai.kchtg.vtsassist.dto.CreateVtsAssistRequest;
import com.hanghai.kchtg.vtsassist.dto.UpdateVtsAssistRequest;
import com.hanghai.kchtg.vtsassist.service.VtsAssistApprovalService;
import com.hanghai.kchtg.vtsassist.service.VtsAssistService;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.security.SecurityUtils;
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

import com.hanghai.kchtg.security.annotation.DataScope;

@RestController
@RequestMapping("/api/v1/vtsassist")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class VtsAssistController {

  private final VtsAssistService vtsAssistService;
  private final VtsAssistApprovalService vtsAssistApprovalService;

  @PostMapping
  @PreAuthorize("@auth.check(authentication, 'vtsassist:create')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> create(
    @Valid @RequestBody CreateVtsAssistRequest request) {
    log.info("Creating VTS Assist: code={}", request.getDeviceCode());
    VtsAssistResponse response = vtsAssistService.create(request);
    return ResponseEntity.ok(ApiResponse.success("Tạo mới hệ thống phụ trợ VTS thành công", response));
  }

  @GetMapping("/generate-code")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:create')")
  public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
    log.info("Generating VTS Assist device code");
    String code = vtsAssistService.generateVtsAssistCode();
    return ResponseEntity.ok(ApiResponse.success("Sinh mã thiết bị thành công", Map.of("deviceCode", code)));
  }

  @GetMapping("/options")
  public ResponseEntity<ApiResponse<List<VtsAssistOptionResponse>>> getOptions() {
    log.info("Getting VTS Assist options list");
    List<VtsAssistOptionResponse> options = vtsAssistService.getOptions();
    return ResponseEntity.ok(ApiResponse.success("Lấy danh mục hệ thống phụ trợ VTS thành công", options));
  }

  @GetMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:read')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> getById(@PathVariable UUID id) {
    log.info("Getting VTS Assist by id={}", id);
    VtsAssistResponse response = vtsAssistService.getById(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hệ thống phụ trợ VTS thành công", response));
  }

  @GetMapping
  @DataScope
  @PreAuthorize("@auth.check(authentication, 'vtsassist:read')")
  public ResponseEntity<ApiResponse<Page<VtsAssistResponse>>> findAll(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) UUID orgUnitId,
    @RequestParam(required = false) String deviceCode,
    @RequestParam(required = false) String deviceName,
    @RequestParam(required = false) String province,
    @RequestParam(required = false) String operatingStatus,
    @RequestParam(required = false) String approvalStatus,
    @RequestParam(required = false) String vtsSystemId,
    @RequestParam(required = false) Integer attachedInfrastructureType,
    @RequestParam(required = false) UUID attachedInfrastructureId,
    @RequestParam(required = false) Integer yearOfUse,
    @RequestParam(required = false) String operatingUnitId,
    @RequestParam(required = false) String updatedFrom,
    @RequestParam(required = false) String updatedTo,
    @RequestParam(required = false) String search,
    @RequestParam(required = false) String sortBy,
    @RequestParam(required = false) String sortOrder) {

    log.info(
      "Listing VTS Assists: page={}, size={}, orgUnitId={}, deviceCode={}, deviceName={}, province={}, status={}, approvalStatus={}, vtsSystemId={}, attachedInfraType={}, attachedInfraId={}",
      page, size, orgUnitId, deviceCode, deviceName, province, operatingStatus, approvalStatus, vtsSystemId, attachedInfrastructureType, attachedInfrastructureId);
    Page<VtsAssistResponse> result = vtsAssistService.findAll(
      page, size, orgUnitId,
      deviceCode, deviceName, province,
      operatingStatus, approvalStatus,
      vtsSystemId,
      attachedInfrastructureType,
      attachedInfrastructureId,
      yearOfUse, updatedFrom, updatedTo, search, sortBy, sortOrder);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hệ thống phụ trợ VTS thành công", result));
  }

  @PutMapping
  @PreAuthorize("@auth.check(authentication, 'vtsassist:update')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> update(
    @Valid @RequestBody UpdateVtsAssistRequest request) {
    log.info("Updating VTS Assist: id={}", request.getId());
    VtsAssistResponse response = vtsAssistService.update(request);
    return ResponseEntity.ok(ApiResponse.success("Cập nhật hệ thống phụ trợ VTS thành công", response));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:delete')")
  public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
    log.info("Soft-deleting VTS Assist: id={}", id);
    vtsAssistService.softDelete(id);
    return ResponseEntity.ok(ApiResponse.success("Xóa hệ thống phụ trợ VTS thành công", null));
  }

  @PostMapping("/{id}/submit")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:update')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> submit(@PathVariable UUID id,
    @RequestBody(required = false) SubmitContentRequest request) {
    log.info("Submitting VTS Assist for approval: id={}", id);
    String content = request != null ? request.getContent() : null;
    VtsAssistResponse response = vtsAssistApprovalService.submit(id, content, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", response));
  }

  @PostMapping("/{id}/approve/c1")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:approvec1')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> approveC1(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    log.info("Approving VTS Assist level 1: id={}", id);
    VtsAssistResponse response = vtsAssistApprovalService.approveC1(id, request, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
  }

  @PostMapping("/{id}/approve/c2")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:approvec2')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> approveC2(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    log.info("Approving VTS Assist level 2: id={}", id);
    VtsAssistResponse response = vtsAssistApprovalService.approveC2(id, request, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
  }

  @GetMapping("/{id}/history")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:history')")
  public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
    @PathVariable UUID id,
    @RequestParam(value = "page", required = false) Integer page,
    @RequestParam(value = "pageSize", required = false) Integer pageSize,
    @RequestParam(value = "keyword", required = false) String keyword,
    @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
    @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
    log.info("Getting VTS Assist history: id={}", id);
    List<HistoryEntry> history = vtsAssistApprovalService.getHistory(id, page, pageSize, keyword, fromDate, toDate);
    return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hệ thống phụ trợ VTS thành công", history));
  }

  public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(UUID id) {
    return getHistory(id, null, null, null, null, null);
  }

  @GetMapping("/history/all")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:history')")
  public ResponseEntity<ApiResponse<Object>> getAllHistory() {
    log.info("Getting all VTS Assist history");
    Object history = vtsAssistApprovalService.getAllHistory();
    return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử hệ thống phụ trợ VTS thành công", history));
  }

  @PostMapping("/{id}/restore")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:delete')")
  public ResponseEntity<ApiResponse<VtsAssistResponse>> restore(@PathVariable UUID id) {
    log.info("Restoring VTS Assist id={}", id);
    VtsAssistResponse response = vtsAssistService.restore(id);
    return ResponseEntity.ok(ApiResponse.success("Khôi phục hệ thống phụ trợ VTS thành công", response));
  }

  // ── Attachment endpoints (File đính kèm) ─────────────────────────

  @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("@auth.check(authentication, 'vtsassist:update')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
      @PathVariable UUID id,
      @RequestParam("files") List<MultipartFile> files) {
    log.info("Uploading VTS Assist attachments: id={}, files={}", id, files.size());
    return ResponseEntity.ok(ApiResponse.success(
        "Tải file đính kèm thành công",
        vtsAssistService.uploadAttachments(id, files, SecurityUtils.getCurrentUserId())));
  }

  @GetMapping("/{id}/attachments")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:read')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
    log.info("Listing VTS Assist attachments: id={}", id);
    return ResponseEntity.ok(ApiResponse.success(
        "Lấy danh sách file đính kèm thành công",
        vtsAssistService.listAttachments(id)));
  }

  @DeleteMapping("/{id}/attachments/{attachmentId}")
  @PreAuthorize("@auth.check(authentication, 'vtsassist:update')")
  public ResponseEntity<ApiResponse<Void>> deleteAttachment(
      @PathVariable UUID id,
      @PathVariable UUID attachmentId) {
    log.info("Deleting VTS Assist attachment: id={}, attachmentId={}", id, attachmentId);
    vtsAssistService.deleteAttachment(id, attachmentId);
    return ResponseEntity.ok(ApiResponse.success("Đã xóa file đính kèm", null));
  }
}
