package com.hanghai.kchtg.vhf.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import org.springframework.format.annotation.DateTimeFormat;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.SubmitContentRequest;
import com.hanghai.kchtg.vhf.dto.ApprovalRequest;
import com.hanghai.kchtg.vhf.dto.VhfResponse;
import com.hanghai.kchtg.vhf.dto.VhfOptionResponse;
import com.hanghai.kchtg.vhf.dto.CreateVhfRequest;
import com.hanghai.kchtg.vhf.dto.UpdateVhfRequest;
import com.hanghai.kchtg.vhf.service.VhfApprovalService;
import com.hanghai.kchtg.vhf.service.VhfService;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.security.SecurityUtils;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.hanghai.kchtg.security.annotation.DataScope;
import org.springframework.validation.annotation.Validated;

/**
 * REST Controller for VHF communication system management.
 * Base path: /api/v1/vhf
 */
@RestController
@RequestMapping({"/api/v1/vhf", "/v1/vhf"})
@Slf4j
@RequiredArgsConstructor
@Validated
@DataScope
public class VhfController {

  private final VhfService vhfService;
  private final VhfApprovalService approvalService;

  @PostMapping
  @PreAuthorize("@auth.check(authentication, 'vhf:create')")
  public ResponseEntity<ApiResponse<VhfResponse>> create(
    @Valid @RequestBody CreateVhfRequest request) {
    log.info("Creating VHF: code={}, name={}", request.getDeviceCode(), request.getDeviceName());
    VhfResponse response = vhfService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(ApiResponse.success("Tạo mới hệ thống VHF thành công", response));
  }

  @GetMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'vhf:read')")
  public ResponseEntity<ApiResponse<VhfResponse>> findById(@PathVariable UUID id) {
    log.info("Fetching VHF: id={}", id);
    VhfResponse response = vhfService.findById(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hệ thống VHF thành công", response));
  }

  @GetMapping
  @PreAuthorize("@auth.check(authentication, 'vhf:read')")
  public ResponseEntity<ApiResponse<Page<VhfResponse>>> findAll(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) UUID orgUnitId,
    @RequestParam(required = false) UUID seaportId,
    @RequestParam(required = false) String deviceCode,
    @RequestParam(required = false) String deviceName,
    @RequestParam(required = false) String province,
    @RequestParam(required = false) String operatingStatus,
    @RequestParam(required = false) String approvalStatus,
    @RequestParam(required = false) String vtsSystemId,
    @RequestParam(required = false) Integer attachedInfrastructureType,
    @RequestParam(required = false) UUID attachedInfrastructureId,
    @RequestParam(required = false) Integer yearOfUse,
    @RequestParam(required = false) String updatedFrom,
    @RequestParam(required = false) String updatedTo,
    @RequestParam(required = false) String search,
    @RequestParam(required = false) String sortBy,
    @RequestParam(required = false) String sortOrder) {

    log.info(
      "Listing VHFs: page={}, size={}, orgUnitId={}, seaportId={}, deviceCode={}, deviceName={}, province={}, status={}, approvalStatus={}",
      page, size, orgUnitId, seaportId, deviceCode, deviceName, province, operatingStatus, approvalStatus);
    Page<VhfResponse> result = vhfService.findAll(
      page, size, orgUnitId, seaportId,
      deviceCode, deviceName, province,
      operatingStatus, approvalStatus,
      vtsSystemId,
      attachedInfrastructureType,
      attachedInfrastructureId,
      yearOfUse, updatedFrom, updatedTo, search, sortBy, sortOrder);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hệ thống thông tin liên lạc VHF thành công", result));
  }

  @PutMapping
  @PreAuthorize("@auth.check(authentication, 'vhf:update')")
  public ResponseEntity<ApiResponse<VhfResponse>> update(
    @Valid @RequestBody UpdateVhfRequest request) {
    log.info("Updating VHF: id={}", request.getId());
    VhfResponse response = vhfService.update(request);
    return ResponseEntity.ok(ApiResponse.success("Cập nhật hệ thống thông tin liên lạc VHF thành công", response));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'vhf:delete')")
  public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
    log.info("Soft-deleting VHF: id={}", id);
    vhfService.softDelete(id);
    return ResponseEntity.ok(ApiResponse.success("Xóa hệ thống thông tin liên lạc VHF thành công", null));
  }

  @PostMapping("/{id}/submit")
  @PreAuthorize("@auth.check(authentication, 'vhf:update')")
  public ResponseEntity<ApiResponse<VhfResponse>> submit(@PathVariable UUID id,
      @RequestBody(required = false) SubmitContentRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    String content = request != null ? request.getContent() : null;
    log.info("Submitting VHF: id={}, user={}", id, currentUserId);
    VhfResponse response = approvalService.submit(id, content, currentUserId);
    return ResponseEntity.ok(ApiResponse.success("Trình duyệt hệ thống VHF thành công", response));
  }

  @PostMapping("/{id}/approve/c1")
  @PreAuthorize("@auth.check(authentication, 'vhf:approvec1')")
  public ResponseEntity<ApiResponse<VhfResponse>> approveC1(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    log.info("C1 approval for VHF: id={}, decision={}, user={}", id, request.getDecision(), currentUserId);
    VhfResponse response = approvalService.approveC1(id, request, currentUserId);
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
  }

  @PostMapping("/{id}/approve/c2")
  @PreAuthorize("@auth.check(authentication, 'vhf:approvec2')")
  public ResponseEntity<ApiResponse<VhfResponse>> approveC2(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    log.info("C2 approval for VHF: id={}, decision={}, user={}", id, request.getDecision(), currentUserId);
    VhfResponse response = approvalService.approveC2(id, request, currentUserId);
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
  }

  @GetMapping("/{id}/history")
  @PreAuthorize("@auth.check(authentication, 'vhf:history') or @auth.check(authentication, 'vhf:read') or @auth.check(authentication, 'data:read')")
  public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(
      @PathVariable UUID id,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String fromDate,
      @RequestParam(required = false) String toDate) {
    log.info("Getting history for VHF: id={}", id);
    List<HistoryEntry> history = approvalService.getHistory(id, page, pageSize, keyword, fromDate, toDate);
    return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử thay đổi thành công", history));
  }

  @PostMapping("/{id}/restore")
  @PreAuthorize("@auth.check(authentication, 'vhf:delete')")
  public ResponseEntity<ApiResponse<VhfResponse>> restore(@PathVariable UUID id) {
    log.info("Restoring VHF: id={}", id);
    VhfResponse response = vhfService.restore(id);
    return ResponseEntity.ok(ApiResponse.success("Khôi phục hệ thống VHF thành công", response));
  }

  @GetMapping("/generate-code")
  @PreAuthorize("@auth.check(authentication, 'vhf:read')")
  public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
    String code = vhfService.generateDeviceCode();
    return ResponseEntity.ok(ApiResponse.success("Sinh mã thiết bị VHF thành công", Map.of("deviceCode", code)));
  }

  @GetMapping("/options")
  @PreAuthorize("@auth.check(authentication, 'vhf:read')")
  public ResponseEntity<ApiResponse<List<VhfOptionResponse>>> getOptions() {
    List<VhfOptionResponse> options = vhfService.getOptions();
    return ResponseEntity.ok(ApiResponse.success("Lấy danh mục tùy chọn VHF thành công", options));
  }

  @GetMapping({"/history", "/history/all"})
  @PreAuthorize("@auth.check(authentication, 'vhf:history') or @auth.check(authentication, 'vhf:read') or @auth.check(authentication, 'data:read')")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getAllHistory() {
    log.info("Getting all history for VHF");
    Map<String, Object> history = approvalService.getAllHistory();
    return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử thay đổi thành công", history));
  }

  // ── ATTACHMENTS (File đính kèm) ───────────────────────────────────

  @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("@auth.check(authentication, 'vhf:update')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
      @PathVariable UUID id,
      @RequestParam("files") List<MultipartFile> files) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    List<AttachmentDto> result = vhfService.uploadAttachments(id, files, currentUserId);
    return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
  }

  @GetMapping("/{id}/attachments")
  @PreAuthorize("@auth.check(authentication, 'vhf:read')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> getAttachments(@PathVariable UUID id) {
    List<AttachmentDto> result = vhfService.getAttachments(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
  }

  @DeleteMapping("/{id}/attachments/{attachmentId}")
  @PreAuthorize("@auth.check(authentication, 'vhf:update')")
  public ResponseEntity<ApiResponse<Void>> deleteAttachment(
      @PathVariable UUID id,
      @PathVariable UUID attachmentId) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    vhfService.deleteAttachment(id, attachmentId, currentUserId);
    return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
  }

  @GetMapping("/{id}/attachments/{attachmentId}/download")
  @PreAuthorize("@auth.check(authentication, 'vhf:read')")
  public ResponseEntity<Resource> downloadAttachment(
      @PathVariable UUID id,
      @PathVariable UUID attachmentId) {
    Attachment attachment = vhfService.getAttachment(id, attachmentId);
    Path path = Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
    if (!Files.isRegularFile(path)) {
      return ResponseEntity.notFound().build();
    }
    Resource resource = new FileSystemResource(path);
    String contentType;
    try {
      contentType = Files.probeContentType(path);
    } catch (Exception ignored) {
      contentType = null;
    }
    MediaType mediaType = contentType == null
        ? MediaType.APPLICATION_OCTET_STREAM
        : MediaType.parseMediaType(contentType);
    return ResponseEntity.ok()
        .contentType(mediaType)
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + (attachment.getFileName() != null ? attachment.getFileName().replace("\"", "") : "attachment") + "\"")
        .body(resource);
  }
}
