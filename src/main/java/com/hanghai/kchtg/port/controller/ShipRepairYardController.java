package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.shiprepairyard.ApproveRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.AttachmentDto;
import com.hanghai.kchtg.port.dto.shiprepairyard.CreateShipRepairYardRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.RejectRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.ShipRepairYardResponse;
import com.hanghai.kchtg.port.dto.shiprepairyard.UpdateShipRepairYardRequest;
import com.hanghai.kchtg.port.service.ShipRepairYardApprovalService;
import com.hanghai.kchtg.port.service.ShipRepairYardService;
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
@RequestMapping("/api/v1/ship-repair-yard")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class ShipRepairYardController {

    private final ShipRepairYardService shipRepairYardService;
    private final ShipRepairYardApprovalService shipRepairYardApprovalService;

    @PostMapping
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<ShipRepairYardResponse>> create(
            @Valid @RequestBody CreateShipRepairYardRequest request) {
        log.info("Creating ShipRepairYard: name={}", request.getShipRepairYardName());
        ShipRepairYardResponse response = shipRepairYardService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cơ sở sửa chữa, đóng tàu thành công", response));
    }

    @GetMapping("/generate-code")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:create')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating ship repair yard code for portId={}", portId);
        String code = shipRepairYardService.generateShipRepairYardCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã cơ sở sửa chữa, đóng tàu thành công", java.util.Map.of("shipRepairYardCode", code)));
    }

    @GetMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<ShipRepairYardResponse>> getById(@PathVariable UUID id) {
        log.info("Getting ShipRepairYard by id={}", id);
        ShipRepairYardResponse response = shipRepairYardService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cơ sở sửa chữa, đóng tàu thành công", response));
    }

    @GetMapping
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Page<ShipRepairYardResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String shipRepairYardCode,
            @RequestParam(required = false) String shipRepairYardName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) UUID pierId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        log.info(
                "Listing ShipRepairYards: page={}, size={}, orgUnitId={}, search={}, shipRepairYardCode={}, shipRepairYardName={}, portId={}, pierId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, shipRepairYardCode, shipRepairYardName, portId, pierId, operationalStatus, approvalStatus);
        Page<ShipRepairYardResponse> result = shipRepairYardService.findAll(
                page, size, orgUnitId,
                search, shipRepairYardCode, shipRepairYardName, portId, pierId,
                provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cơ sở sửa chữa, đóng tàu thành công", result));
    }

    @PutMapping
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<ShipRepairYardResponse>> update(
            @Valid @RequestBody UpdateShipRepairYardRequest request) {
        log.info("Updating ShipRepairYard: id={}", request.getId());
        ShipRepairYardResponse response = shipRepairYardService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cơ sở sửa chữa, đóng tàu thành công", response));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:delete')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting ShipRepairYard: id={}", id);
        shipRepairYardService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @PostMapping("/{id}/approve")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving ShipRepairYard: id={}, cap={}", id, request.getCap());
        shipRepairYardApprovalService.approve(id, authentication.getName(), request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @PostMapping("/{id}/reject")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:approve')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting ShipRepairYard: id={}, cap={}", id, request.getCap());
        shipRepairYardApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @GetMapping("/history/all")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all ShipRepairYard history");
        Object history = shipRepairYardApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử cơ sở sửa chữa, đóng tàu thành công", history));
    }

    @GetMapping("/{id}/history")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:history')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting ShipRepairYard history: id={}", id);
        Object history = shipRepairYardApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cơ sở sửa chữa, đóng tàu thành công", history));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = shipRepairYardService.uploadAttachments("SHIP_REPAIR_YARD", id, files, userId);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:read')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = shipRepairYardService.listAttachments("SHIP_REPAIR_YARD", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    // @PreAuthorize("@auth.check(authentication, 'shiprepairyard:update')")  // TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN (chuẩn Khu neo đậu)
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        shipRepairYardService.deleteAttachment("SHIP_REPAIR_YARD", id, attId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }
}
