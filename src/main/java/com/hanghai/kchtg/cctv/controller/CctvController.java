package com.hanghai.kchtg.cctv.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.dto.CctvOptionResponse;
import com.hanghai.kchtg.cctv.dto.CreateCctvRequest;
import com.hanghai.kchtg.cctv.dto.UpdateCctvRequest;
import com.hanghai.kchtg.cctv.service.CctvApprovalService;
import com.hanghai.kchtg.cctv.service.CctvService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;

import com.hanghai.kchtg.security.annotation.DataScope;

@RestController
@RequestMapping("/api/v1/cctv")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class CctvController {

  private final CctvService cctvService;
  private final CctvApprovalService cctvApprovalService;

  @PostMapping
  @PreAuthorize("@auth.check(authentication, 'cctv:create')")
  public ResponseEntity<ApiResponse<CctvResponse>> create(
    @Valid @RequestBody CreateCctvRequest request) {
    log.info("Creating CCTV: code={}", request.getDeviceCode());
    CctvResponse response = cctvService.create(request);
    return ResponseEntity.ok(ApiResponse.success("Tạo mới hệ thống CCTV thành công", response));
  }

  @GetMapping("/generate-code")
  @PreAuthorize("@auth.check(authentication, 'cctv:create')")
  public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
    log.info("Generating CCTV device code");
    String code = cctvService.generateCctvCode();
    return ResponseEntity.ok(ApiResponse.success("Sinh mã thiết bị thành công", Map.of("deviceCode", code)));
  }

  @GetMapping("/options")
  public ResponseEntity<ApiResponse<List<CctvOptionResponse>>> getOptions() {
    log.info("Getting CCTV options list");
    List<CctvOptionResponse> options = cctvService.getOptions();
    return ResponseEntity.ok(ApiResponse.success("Lấy danh mục hệ thống CCTV thành công", options));
  }

  @GetMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'cctv:read')")
  public ResponseEntity<ApiResponse<CctvResponse>> getById(@PathVariable UUID id) {
    log.info("Getting CCTV by id={}", id);
    CctvResponse response = cctvService.getById(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hệ thống CCTV thành công", response));
  }

  @GetMapping
  @DataScope
  @PreAuthorize("@auth.check(authentication, 'cctv:read')")
  public ResponseEntity<ApiResponse<Page<CctvResponse>>> findAll(
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
    @RequestParam(required = false) String search) {

    log.info(
      "Listing CCTVs: page={}, size={}, orgUnitId={}, deviceCode={}, deviceName={}, province={}, status={}, approvalStatus={}, vtsSystemId={}, attachedInfraType={}, attachedInfraId={}",
      page, size, orgUnitId, deviceCode, deviceName, province, operatingStatus, approvalStatus, vtsSystemId, attachedInfrastructureType, attachedInfrastructureId);
    Page<CctvResponse> result = cctvService.findAll(
      page, size, orgUnitId,
      deviceCode, deviceName, province,
      operatingStatus, approvalStatus,
      vtsSystemId,
      attachedInfrastructureType,
      attachedInfrastructureId,
      yearOfUse, updatedFrom, updatedTo, search);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hệ thống CCTV thành công", result));
  }

  @PutMapping
  @PreAuthorize("@auth.check(authentication, 'cctv:update')")
  public ResponseEntity<ApiResponse<CctvResponse>> update(
    @Valid @RequestBody UpdateCctvRequest request) {
    log.info("Updating CCTV: id={}", request.getId());
    CctvResponse response = cctvService.update(request);
    return ResponseEntity.ok(ApiResponse.success("Cập nhật hệ thống CCTV thành công", response));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("@auth.check(authentication, 'cctv:delete')")
  public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
    log.info("Soft-deleting CCTV: id={}", id);
    cctvService.softDelete(id);
    return ResponseEntity.ok(ApiResponse.success("Xóa hệ thống CCTV thành công", null));
  }

  @PostMapping("/{id}/approve")
  @PreAuthorize("@auth.check(authentication, 'cctv:approve')")
  public ResponseEntity<ApiResponse<Void>> approve(
    @PathVariable UUID id,
    Authentication authentication) {
    String userId = authentication.getName();
    log.info("Approving CCTV: id={}, userId={}", id, userId);
    cctvApprovalService.approve(id, userId, null);
    return ResponseEntity.ok(ApiResponse.success("Phê duyệt hệ thống CCTV thành công", null));
  }

  @PostMapping("/{id}/reject")
  @PreAuthorize("@auth.check(authentication, 'cctv:approve')")
  public ResponseEntity<ApiResponse<Void>> reject(
    @PathVariable UUID id,
    @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
    Authentication authentication) {
    String userId = authentication.getName();
    log.info("Rejecting CCTV: id={}, userId={}", id, userId);
    cctvApprovalService.approve(id, userId, reason);
    return ResponseEntity.ok(ApiResponse.success("Từ chối hệ thống CCTV thành công", null));
  }

  @GetMapping("/{id}/history")
  @PreAuthorize("@auth.check(authentication, 'cctv:history')")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(
    @PathVariable UUID id) {
    log.info("Getting CCTV history: id={}", id);
    Map<String, Object> history = cctvApprovalService.getHistory(id);
    return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hệ thống CCTV thành công", history));
  }

  @GetMapping("/history/all")
  @PreAuthorize("@auth.check(authentication, 'cctv:history')")
  public ResponseEntity<ApiResponse<Object>> getAllHistory() {
    log.info("Getting all CCTV history");
    Object history = cctvApprovalService.getAllHistory();
    return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử hệ thống CCTV thành công", history));
  }

  @PostMapping("/{id}/restore")
  @PreAuthorize("@auth.check(authentication, 'cctv:delete')")
  public ResponseEntity<ApiResponse<CctvResponse>> restore(@PathVariable UUID id) {
    log.info("Restoring CCTV id={}", id);
    CctvResponse response = cctvService.restore(id);
    return ResponseEntity.ok(ApiResponse.success("Khôi phục hệ thống CCTV thành công", response));
  }
}
