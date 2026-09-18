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
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:create')")
    public ResponseEntity<ApiResponse<ShipRepairYardResponse>> create(
            @Valid @RequestBody CreateShipRepairYardRequest request) {
        log.info("Creating ShipRepairYard: name={}", request.getShipRepairYardName());
        ShipRepairYardResponse response = shipRepairYardService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cơ sở sửa chữa, đóng tàu thành công", response));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:create', 'shiprepairyard:read')")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating ship repair yard code for portId={}", portId);
        String code = shipRepairYardService.generateShipRepairYardCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã cơ sở sửa chữa, đóng tàu thành công", java.util.Map.of("shipRepairYardCode", code)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:read')")
    public ResponseEntity<ApiResponse<ShipRepairYardResponse>> getById(@PathVariable UUID id) {
        log.info("Getting ShipRepairYard by id={}", id);
        ShipRepairYardResponse response = shipRepairYardService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cơ sở sửa chữa, đóng tàu thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:read')")
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
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:update', 'shiprepairyard:approvec2')")
    public ResponseEntity<ApiResponse<ShipRepairYardResponse>> update(
            @Valid @RequestBody UpdateShipRepairYardRequest request) {
        log.info("Updating ShipRepairYard: id={}", request.getId());
        ShipRepairYardResponse response = shipRepairYardService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cơ sở sửa chữa, đóng tàu thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting ShipRepairYard: id={}", id);
        shipRepairYardService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:update', 'shiprepairyard:create')")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        String content = body != null ? body.get("content") : null;
        log.info("Submitting ShipRepairYard for approval: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        shipRepairYardApprovalService.submit(id, content, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Gửi phê duyệt cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @PostMapping(value = {"/{id}/approve/c1", "/{id}/approvec1"})
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:approvec1')")
    public ResponseEntity<ApiResponse<Void>> approveC1(
            @PathVariable UUID id,
            @RequestBody(required = false) ApproveRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String content = request != null && request.getContent() != null ? request.getContent() : reason;
        log.info("Approving ShipRepairYard C1: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        shipRepairYardApprovalService.approve(id, authentication != null ? authentication.getName() : null, "CANG_VU", content);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Chi cục thành công", null));
    }

    @PostMapping(value = {"/{id}/approve/c2", "/{id}/approvec2", "/{id}/approve-l2"})
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:approvec2')")
    public ResponseEntity<ApiResponse<Void>> approveC2(
            @PathVariable UUID id,
            @RequestBody(required = false) ApproveRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String content = request != null && request.getContent() != null ? request.getContent() : reason;
        log.info("Approving ShipRepairYard C2: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        shipRepairYardApprovalService.approve(id, authentication != null ? authentication.getName() : null, "CUC", content);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp Cục thành công", null));
    }

    @PostMapping(value = {"/{id}/reject/c1", "/{id}/rejectc1"})
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:approvec1')")
    public ResponseEntity<ApiResponse<Void>> rejectC1(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String lyDo = request != null && request.getLyDo() != null ? request.getLyDo() : reason;
        log.info("Rejecting ShipRepairYard C1: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        shipRepairYardApprovalService.reject(id, authentication != null ? authentication.getName() : null, "CANG_VU", lyDo);
        return ResponseEntity.ok(ApiResponse.success("Từ chối phê duyệt cấp Chi cục thành công", null));
    }

    @PostMapping(value = {"/{id}/reject/c2", "/{id}/rejectc2"})
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:approvec2')")
    public ResponseEntity<ApiResponse<Void>> rejectC2(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String lyDo = request != null && request.getLyDo() != null ? request.getLyDo() : reason;
        log.info("Rejecting ShipRepairYard C2: id={}, user={}", id, authentication != null ? authentication.getName() : null);
        shipRepairYardApprovalService.reject(id, authentication != null ? authentication.getName() : null, "CUC", lyDo);
        return ResponseEntity.ok(ApiResponse.success("Từ chối phê duyệt cấp Cục thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:approvec1', 'shiprepairyard:approvec2')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving ShipRepairYard: id={}, cap={}", id, request.getCap());
        shipRepairYardApprovalService.approve(id, authentication != null ? authentication.getName() : null, request.getCap(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:approvec1', 'shiprepairyard:approvec2')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) RejectRequest request,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String cap = request != null ? request.getCap() : null;
        String lyDo = request != null && request.getLyDo() != null ? request.getLyDo() : reason;
        log.info("Rejecting ShipRepairYard: id={}, cap={}, reason={}", id, cap, lyDo);
        shipRepairYardApprovalService.reject(id, authentication != null ? authentication.getName() : null, cap, lyDo);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cơ sở sửa chữa, đóng tàu thành công", null));
    }

    @GetMapping("/history/all")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:history', 'shiprepairyard:read', 'data:read')")
    public ResponseEntity<ApiResponse<Object>> getAllHistory() {
        log.info("Getting all ShipRepairYard history");
        Object history = shipRepairYardApprovalService.getAllHistory();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả lịch sử cơ sở sửa chữa, đóng tàu thành công", history));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:history', 'shiprepairyard:read', 'data:read')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting ShipRepairYard history: id={}", id);
        Object history = shipRepairYardApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cơ sở sửa chữa, đóng tàu thành công", history));
    }

    // ── Attachment endpoints ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:update')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "skipHistory", required = false, defaultValue = "false") boolean skipHistory,
            Authentication authentication) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không có file nào được chọn để tải lên"));
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AttachmentDto> result = shipRepairYardService.uploadAttachments("SHIP_REPAIR_YARD", id, files, userId, skipHistory);
        return ResponseEntity.ok(ApiResponse.success("Tải lên file đính kèm thành công", result));
    }

    @GetMapping("/{id}/attachments")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:read')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        List<AttachmentDto> result = shipRepairYardService.listAttachments("SHIP_REPAIR_YARD", id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách file đính kèm thành công", result));
    }

    @DeleteMapping("/{id}/attachments/{attId}")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:update')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId,
            @RequestParam(value = "skipHistory", required = false, defaultValue = "false") boolean skipHistory,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        shipRepairYardService.deleteAttachment("SHIP_REPAIR_YARD", id, attId, userId, skipHistory);
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    @GetMapping("/{id}/attachments/{attId}/download")
    @PreAuthorize("@auth.checkAny(authentication, 'shiprepairyard:manage', 'shiprepairyard:read')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attId) {
        com.hanghai.kchtg.port.entity.Attachment attachment = shipRepairYardService.getAttachmentGeneric(id, attId);
        java.nio.file.Path path = java.nio.file.Paths.get(attachment.getFilePath()).toAbsolutePath().normalize();
        if (!java.nio.file.Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(path);
        String contentType;
        try {
            contentType = java.nio.file.Files.probeContentType(path);
        } catch (Exception ignored) {
            contentType = null;
        }
        MediaType mediaType = contentType == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + attachment.getFileName().replace("\"", "") + "\"")
                .body(resource);
    }
}
