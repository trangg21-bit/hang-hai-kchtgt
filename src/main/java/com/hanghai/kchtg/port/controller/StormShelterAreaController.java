package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.stormshelter.ApproveRequest;
import com.hanghai.kchtg.port.dto.stormshelter.AttachmentDto;
import com.hanghai.kchtg.port.dto.stormshelter.CreateStormShelterAreaRequest;
import com.hanghai.kchtg.port.dto.stormshelter.RejectRequest;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterAreaResponse;
import com.hanghai.kchtg.port.dto.stormshelter.UpdateStormShelterAreaRequest;
import com.hanghai.kchtg.port.repository.StormShelterMooringWaterAreaRepository;
import com.hanghai.kchtg.port.service.StormShelterAreaApprovalService;
import com.hanghai.kchtg.port.service.StormShelterAreaService;
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
@RequestMapping("/api/v1/storm-shelter")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class StormShelterAreaController {

    private final StormShelterAreaService stormShelterAreaService;
    private final StormShelterAreaApprovalService stormShelterAreaApprovalService;
    private final StormShelterMooringWaterAreaRepository stormShelterMooringWaterAreaRepository;

    @PostMapping
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<StormShelterAreaResponse>> create(
            @Valid @RequestBody CreateStormShelterAreaRequest request) {
        log.info("Creating StormShelterArea: name={}", request.getStormShelterName());
        StormShelterAreaResponse response = stormShelterAreaService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới khu tránh, trú bão thành công", response));
    }

    @GetMapping("/generate-code")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:create'")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating storm shelter code for portId={}", portId);
        String code = stormShelterAreaService.generateStormShelterCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã khu tránh, trú bão thành công", java.util.Map.of("stormShelterCode", code)));
    }

    @GetMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<StormShelterAreaResponse>> getById(@PathVariable UUID id) {
        log.info("Getting StormShelterArea by id={}", id);
        StormShelterAreaResponse response = stormShelterAreaService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin khu tránh, trú bão thành công", response));
    }

    @GetMapping
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Page<StormShelterAreaResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String stormShelterCode,
            @RequestParam(required = false) String stormShelterName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) UUID navigationChannelId,
            @RequestParam(required = false) UUID buoyStationId,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        log.info(
                "Listing StormShelterAreas: page={}, size={}, orgUnitId={}, search={}, stormShelterCode={}, stormShelterName={}, portId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, stormShelterCode, stormShelterName, portId, operationalStatus, approvalStatus);
        Page<StormShelterAreaResponse> result = stormShelterAreaService.findAll(
                page, size, orgUnitId,
                search, stormShelterCode, stormShelterName, portId, navigationChannelId, buoyStationId,
                classification, provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khu tránh, trú bão thành công", result));
    }

    @PutMapping
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<StormShelterAreaResponse>> update(
            @Valid @RequestBody UpdateStormShelterAreaRequest request) {
        log.info("Updating StormShelterArea: id={}", request.getId());
        StormShelterAreaResponse response = stormShelterAreaService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khu tránh, trú bão thành công", response));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:delete')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting StormShelterArea: id={}", id);
        stormShelterAreaService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khu tránh, trú bão thành công", null));
    }

    @PostMapping("/{id}/approve")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving StormShelterArea: id={}, cap={}", id, request.getCap());
        stormShelterAreaApprovalService.approve(id, authentication.getName(), request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt khu tránh, trú bão thành công", null));
    }

    @PostMapping("/{id}/reject")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting StormShelterArea: id={}, cap={}", id, request.getCap());
        stormShelterAreaApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối khu tránh, trú bão thành công", null));
    }

    @GetMapping("/history/all")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all StormShelterArea history");
        Object history = stormShelterAreaApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử khu tránh, trú bão thành công", history));
    }

    @GetMapping("/{id}/history")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting StormShelterArea history: id={}", id);
        Object history = stormShelterAreaApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử khu tránh, trú bão thành công", history));
    }

    @GetMapping("/{id}/children")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getChildren(@PathVariable UUID id) {
        long mooringWaterAreaCount = stormShelterMooringWaterAreaRepository.countByStormShelterAreaIdAndDeletedAtIsNull(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công",
                java.util.Map.of("mooringWaterAreaCount", mooringWaterAreaCount)));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = stormShelterAreaService.uploadAttachments("STORM_SHELTER", id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = stormShelterAreaService.listAttachments("STORM_SHELTER", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    // @PreAuthorize("@auth.check(authentication, 'stormshelter:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        stormShelterAreaService.deleteAttachment("STORM_SHELTER", id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
