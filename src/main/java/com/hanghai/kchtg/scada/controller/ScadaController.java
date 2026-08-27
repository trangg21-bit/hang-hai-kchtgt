package com.hanghai.kchtg.scada.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.SubmitContentRequest;
import com.hanghai.kchtg.scada.dto.ApprovalRequest;
import com.hanghai.kchtg.scada.dto.ScadaResponse;
import com.hanghai.kchtg.scada.dto.ScadaOptionResponse;
import com.hanghai.kchtg.scada.dto.CreateScadaRequest;
import com.hanghai.kchtg.scada.dto.UpdateScadaRequest;
import com.hanghai.kchtg.scada.service.ScadaApprovalService;
import com.hanghai.kchtg.scada.service.ScadaService;
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
@RequestMapping("/api/v1/scada")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class ScadaController {

  private final ScadaService scadaService;
  private final ScadaApprovalService scadaApprovalService;

  @PostMapping
  @PreAuthorize("@auth.check(authentication, 'scada:create')")
  public ResponseEntity<ApiResponse<ScadaResponse>> create(
    @Valid @RequestBody CreateScadaRequest request) {
    log.info("Creating SCADA: code={}", request.getDeviceCode());
    ScadaResponse response = scadaService.create(request);
    return ResponseEntity.ok(ApiResponse.success("Tạo mới hệ thống SCADA thành công", response));
  }

  @GetMapping("/generate-code")
  @PreAuthorize("@auth.check(authentication, 'scada:create')")
  public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
    log.info("Generating SCADA device code");
    String code = scadaService.generateScadaCode();
    return ResponseEntity.ok(ApiResponse.success("Sinh mã thiết bị thành công", Map.of("deviceCode", code)));
  }

  @GetMapping("/options")
  public ResponseEntity<ApiResponse<List<ScadaOptionResponse>>> getOptions() {
    log.info("Getting SCADA options list");
    List<ScadaOptionResponse> options = scadaService.getOptions();
    return ResponseEntity.ok(ApiResponse.success("Lấy danh mục hệ thống SCADA thành công", options));
  }

  @GetMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'scada:read')")
  public ResponseEntity<ApiResponse<ScadaResponse>> getById(@PathVariable UUID id) {
    log.info("Getting SCADA by id={}", id);
    ScadaResponse response = scadaService.getById(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hệ thống SCADA thành công", response));
  }

  @GetMapping
  @DataScope
  @PreAuthorize("@auth.check(authentication, 'scada:read')")
  public ResponseEntity<ApiResponse<Page<ScadaResponse>>> findAll(
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
      "Listing SCADAs: page={}, size={}, orgUnitId={}, deviceCode={}, deviceName={}, province={}, status={}, approvalStatus={}, vtsSystemId={}, attachedInfraType={}, attachedInfraId={}",
      page, size, orgUnitId, deviceCode, deviceName, province, operatingStatus, approvalStatus, vtsSystemId, attachedInfrastructureType, attachedInfrastructureId);
    Page<ScadaResponse> result = scadaService.findAll(
      page, size, orgUnitId,
      deviceCode, deviceName, province,
      operatingStatus, approvalStatus,
      vtsSystemId,
      attachedInfrastructureType,
      attachedInfrastructureId,
      yearOfUse, updatedFrom, updatedTo, search, sortBy, sortOrder);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hệ thống SCADA thành công", result));
  }

  @PutMapping
  @PreAuthorize("@auth.check(authentication, 'scada:update')")
  public ResponseEntity<ApiResponse<ScadaResponse>> update(
    @Valid @RequestBody UpdateScadaRequest request) {
    log.info("Updating SCADA: id={}", request.getId());
    ScadaResponse response = scadaService.update(request);
    return ResponseEntity.ok(ApiResponse.success("Cập nhật hệ thống SCADA thành công", response));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'scada:delete')")
  public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
    log.info("Soft-deleting SCADA: id={}", id);
    scadaService.softDelete(id);
    return ResponseEntity.ok(ApiResponse.success("Xóa hệ thống SCADA thành công", null));
  }

  @PostMapping("/{id}/submit")
  @PreAuthorize("@auth.check(authentication, 'scada:update')")
  public ResponseEntity<ApiResponse<ScadaResponse>> submit(@PathVariable UUID id,
    @RequestBody(required = false) SubmitContentRequest request) {
    log.info("Submitting SCADA for approval: id={}", id);
    String content = request != null ? request.getContent() : null;
    ScadaResponse response = scadaApprovalService.submit(id, content, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt thành công", response));
  }

  @PostMapping("/{id}/approve/c1")
  @PreAuthorize("@auth.check(authentication, 'scada:approvec1')")
  public ResponseEntity<ApiResponse<ScadaResponse>> approveC1(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    log.info("Approving SCADA level 1: id={}", id);
    ScadaResponse response = scadaApprovalService.approveC1(id, request, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
  }

  @PostMapping("/{id}/approve/c2")
  @PreAuthorize("@auth.check(authentication, 'scada:approvec2')")
  public ResponseEntity<ApiResponse<ScadaResponse>> approveC2(
    @PathVariable UUID id,
    @Valid @RequestBody ApprovalRequest request) {
    log.info("Approving SCADA level 2: id={}", id);
    ScadaResponse response = scadaApprovalService.approveC2(id, request, SecurityUtils.getCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
  }

  @GetMapping("/{id}/history")
  @PreAuthorize("@auth.check(authentication, 'scada:history')")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(
    @PathVariable UUID id) {
    log.info("Getting SCADA history: id={}", id);
    Map<String, Object> history = scadaApprovalService.getHistory(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hệ thống SCADA thành công", history));
  }

  @GetMapping("/history/all")
  @PreAuthorize("@auth.check(authentication, 'scada:history')")
  public ResponseEntity<ApiResponse<Object>> getAllHistory() {
    log.info("Getting all SCADA history");
    Object history = scadaApprovalService.getAllHistory();
    return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử hệ thống SCADA thành công", history));
  }

  @PostMapping("/{id}/restore")
  @PreAuthorize("@auth.check(authentication, 'scada:delete')")
  public ResponseEntity<ApiResponse<ScadaResponse>> restore(@PathVariable UUID id) {
    log.info("Restoring SCADA id={}", id);
    ScadaResponse response = scadaService.restore(id);
    return ResponseEntity.ok(ApiResponse.success("Khôi phục hệ thống SCADA thành công", response));
  }

  // ── Attachment endpoints (File đính kèm) ─────────────────────────

  @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("@auth.check(authentication, 'scada:update')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
      @PathVariable UUID id,
      @RequestParam("files") List<MultipartFile> files) {
    log.info("Uploading SCADA attachments: id={}, files={}", id, files.size());
    return ResponseEntity.ok(ApiResponse.success(
        "Tải file đính kèm thành công",
        scadaService.uploadAttachments(id, files, SecurityUtils.getCurrentUserId())));
  }

  @GetMapping("/{id}/attachments")
  @PreAuthorize("@auth.check(authentication, 'scada:read')")
  public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
    log.info("Listing SCADA attachments: id={}", id);
    return ResponseEntity.ok(ApiResponse.success(
        "Lấy danh sách file đính kèm thành công",
        scadaService.listAttachments(id)));
  }

  @DeleteMapping("/{id}/attachments/{attachmentId}")
  @PreAuthorize("@auth.check(authentication, 'scada:update')")
  public ResponseEntity<ApiResponse<Void>> deleteAttachment(
      @PathVariable UUID id,
      @PathVariable UUID attachmentId) {
    log.info("Deleting SCADA attachment: id={}, attachmentId={}", id, attachmentId);
    scadaService.deleteAttachment(id, attachmentId);
    return ResponseEntity.ok(ApiResponse.success("Đã xóa file đính kèm", null));
  }
}
