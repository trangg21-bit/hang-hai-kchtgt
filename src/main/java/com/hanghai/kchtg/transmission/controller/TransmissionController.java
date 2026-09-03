package com.hanghai.kchtg.transmission.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import org.springframework.format.annotation.DateTimeFormat;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.SubmitContentRequest;
import com.hanghai.kchtg.transmission.dto.ApprovalRequest;
import com.hanghai.kchtg.transmission.dto.TransmissionResponse;
import com.hanghai.kchtg.transmission.dto.TransmissionOptionResponse;
import com.hanghai.kchtg.transmission.dto.CreateTransmissionRequest;
import com.hanghai.kchtg.transmission.dto.UpdateTransmissionRequest;
import com.hanghai.kchtg.transmission.service.TransmissionApprovalService;
import com.hanghai.kchtg.transmission.service.TransmissionService;
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
@RequestMapping("/api/v1/transmission")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class TransmissionController {

  private final TransmissionService transmissionService;
  private final TransmissionApprovalService transmissionApprovalService;

  @PostMapping
  @PreAuthorize("@auth.check(authentication, 'transmission:create')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> create(
    @Valid @RequestBody CreateTransmissionRequest request) {
    log.info("Creating transmission: code={}", request.getDeviceCode());
    TransmissionResponse response = transmissionService.create(request);
    return ResponseEntity.ok(ApiResponse.success("Tạo mới hệ thống truyền dẫn thành công", response));
  }

  @GetMapping("/generate-code")
  @PreAuthorize("@auth.check(authentication, 'transmission:create')")
  public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
    log.info("Generating transmission device code");
    String code = transmissionService.generateTransmissionCode();
    return ResponseEntity.ok(ApiResponse.success("Sinh mã thiết bị thành công", Map.of("deviceCode", code)));
  }

  @GetMapping("/options")
  public ResponseEntity<ApiResponse<List<TransmissionOptionResponse>>> getOptions() {
    log.info("Getting transmission options list");
    List<TransmissionOptionResponse> options = transmissionService.getOptions();
    return ResponseEntity.ok(ApiResponse.success("Lấy danh mục hệ thống truyền dẫn thành công", options));
  }

  @GetMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'transmission:read')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> getById(@PathVariable UUID id) {
    log.info("Getting transmission by id={}", id);
    TransmissionResponse response = transmissionService.getById(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hệ thống truyền dẫn thành công", response));
  }

  @GetMapping
  @DataScope
  @PreAuthorize("@auth.check(authentication, 'transmission:read')")
  public ResponseEntity<ApiResponse<Page<TransmissionResponse>>> findAll(
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
      "Listing transmissions: page={}, size={}, orgUnitId={}, deviceCode={}, deviceName={}, province={}, status={}, approvalStatus={}, vtsSystemId={}, attachedInfraType={}, attachedInfraId={}",
      page, size, orgUnitId, deviceCode, deviceName, province, operatingStatus, approvalStatus, vtsSystemId, attachedInfrastructureType, attachedInfrastructureId);
    Page<TransmissionResponse> result = transmissionService.findAll(
      page, size, orgUnitId,
      deviceCode, deviceName, province,
      operatingStatus, approvalStatus,
      vtsSystemId,
      attachedInfrastructureType,
      attachedInfrastructureId,
      yearOfUse, updatedFrom, updatedTo, search, sortBy, sortOrder);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hệ thống truyền dẫn thành công", result));
  }

  @PutMapping
  @PreAuthorize("@auth.check(authentication, 'transmission:update')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> update(
    @Valid @RequestBody UpdateTransmissionRequest request) {
    log.info("Updating transmission: id={}", request.getId());
    TransmissionResponse response = transmissionService.update(request);
    return ResponseEntity.ok(ApiResponse.success("Cập nhật hệ thống truyền dẫn thành công", response));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'transmission:delete')")
  public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
    log.info("Soft-deleting transmission: id={}", id);
    transmissionService.softDelete(id);
    return ResponseEntity.ok(ApiResponse.success("Xóa hệ thống truyền dẫn thành công", null));
  }

  @PostMapping("/{id}/submit")
  @PreAuthorize("@auth.check(authentication, 'transmission:update')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> submit(@PathVariable UUID id,
    @RequestBody(required = false) SubmitContentRequest request) {
    log.info("Submitting transmission for approval: id={}", id);
    String content = request != null ? request.getContent() : null;
    TransmissionResponse response = transmissionApprovalService.submit(id, content, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", response));
  }

  @PostMapping("/{id}/approve/c1")
  @PreAuthorize("@auth.check(authentication, 'transmission:approvec1')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> approveC1(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    log.info("Approving transmission level 1: id={}", id);
    TransmissionResponse response = transmissionApprovalService.approveC1(id, request, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", response));
  }

  @PostMapping("/{id}/approve/c2")
  @PreAuthorize("@auth.check(authentication, 'transmission:approvec2')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> approveC2(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    log.info("Approving transmission level 2: id={}", id);
    TransmissionResponse response = transmissionApprovalService.approveC2(id, request, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", response));
  }

  @GetMapping("/{id}/history")
  @PreAuthorize("@auth.check(authentication, 'transmission:history')")
  public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
    @PathVariable UUID id,
    @RequestParam(value = "page", required = false) Integer page,
    @RequestParam(value = "pageSize", required = false) Integer pageSize,
    @RequestParam(value = "keyword", required = false) String keyword,
    @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
    @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
    log.info("Getting transmission history: id={}", id);
    List<HistoryEntry> history = transmissionApprovalService.getHistory(id, page, pageSize, keyword, fromDate, toDate);
    return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hệ thống truyền dẫn thành công", history));
  }

  public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(UUID id) {
    return getHistory(id, null, null, null, null, null);
  }

  @GetMapping("/history/all")
  @PreAuthorize("@auth.check(authentication, 'transmission:history')")
  public ResponseEntity<ApiResponse<Object>> getAllHistory() {
    log.info("Getting all transmission history");
    Object history = transmissionApprovalService.getAllHistory();
    return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử hệ thống truyền dẫn thành công", history));
  }

  @PostMapping("/{id}/restore")
  @PreAuthorize("@auth.check(authentication, 'transmission:delete')")
  public ResponseEntity<ApiResponse<TransmissionResponse>> restore(@PathVariable UUID id) {
    log.info("Restoring transmission id={}", id);
    TransmissionResponse response = transmissionService.restore(id);
    return ResponseEntity.ok(ApiResponse.success("Khôi phục hệ thống truyền dẫn thành công", response));
  }

  // ── Attachment endpoints (File đính kèm) ─────────────────────────

  @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("@auth.check(authentication, 'transmission:update')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
      @PathVariable UUID id,
      @RequestParam("files") List<MultipartFile> files) {
    log.info("Uploading transmission attachments: id={}, files={}", id, files.size());
    return ResponseEntity.ok(ApiResponse.success(
        "Tải file đính kèm thành công",
        transmissionService.uploadAttachments(id, files, SecurityUtils.getCurrentUserId())));
  }

  @GetMapping("/{id}/attachments")
  @PreAuthorize("@auth.check(authentication, 'transmission:read')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
    log.info("Listing transmission attachments: id={}", id);
    return ResponseEntity.ok(ApiResponse.success(
        "Lấy danh sách file đính kèm thành công",
        transmissionService.listAttachments(id)));
  }

  @DeleteMapping("/{id}/attachments/{attachmentId}")
  @PreAuthorize("@auth.check(authentication, 'transmission:update')")
  public ResponseEntity<ApiResponse<Void>> deleteAttachment(
      @PathVariable UUID id,
      @PathVariable UUID attachmentId) {
    log.info("Deleting transmission attachment: id={}, attachmentId={}", id, attachmentId);
    transmissionService.deleteAttachment(id, attachmentId);
    return ResponseEntity.ok(ApiResponse.success("Đã xóa file đính kèm", null));
  }
}
