package com.hanghai.kchtg.beacon.controller;

import com.hanghai.kchtg.beacon.dto.beacon_station.BeaconStationResponse;
import com.hanghai.kchtg.beacon.dto.beacon_station.CreateBeaconStationRequest;
import com.hanghai.kchtg.beacon.dto.beacon_station.UpdateBeaconStationRequest;
import com.hanghai.kchtg.beacon.service.BeaconStationService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import com.hanghai.kchtg.security.annotation.DataScope;

/**
 * REST Controller for BeaconStation CRUD + approval endpoints (F-068 to F-072).
 */
@RestController
@RequestMapping("/api/beacon-stations")
@RequiredArgsConstructor
@DataScope
public class BeaconStationController {

    private final BeaconStationService beaconStationService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'beaconstation:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<BeaconStationResponse>>> findAll() {
            return ResponseEntity.ok(ApiResponse.success(beaconStationService.findAll()));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'beaconstation:create')")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode() {
        String code = beaconStationService.generateBeaconStationCode();
        return ResponseEntity.ok(ApiResponse.success("Sinh mã đèn biển thành công", java.util.Map.of("code", code)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'beaconstation:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<BeaconStationResponse>> findById(
                    @PathVariable UUID id) {
            return ResponseEntity.ok(ApiResponse.success(beaconStationService.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BeaconStationResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID unitId,
            @RequestParam(required = false) UUID seaportId,
            @RequestParam(required = false) String operator,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) Integer operationalStatus,
            @RequestParam(required = false) Double stationArea,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) String commissionedFrom,
            @RequestParam(required = false) String commissionedTo,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo) {
        return ResponseEntity.ok(ApiResponse.success(
                beaconStationService.search(name, code, type, status,
                        unitId, seaportId, operator, provinceId,
                        operationalStatus, stationArea, approvalStatus, updatedBy,
                        commissionedFrom, commissionedTo, updatedFrom, updatedTo)));
    }

    @GetMapping("/search-paged")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<BeaconStationResponse>>> searchPaged(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID unitId,
            @RequestParam(required = false) UUID seaportId,
            @RequestParam(required = false) String operator,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) Integer operationalStatus,
            @RequestParam(required = false) Double stationArea,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) String commissionedFrom,
            @RequestParam(required = false) String commissionedTo,
            @RequestParam(required = false) String updatedFrom,
            @RequestParam(required = false) String updatedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                beaconStationService.searchPaged(name, code, type, status,
                        unitId, seaportId, operator, provinceId,
                        operationalStatus, stationArea, approvalStatus, updatedBy,
                        commissionedFrom, commissionedTo, updatedFrom, updatedTo,
                        pageable)));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'beaconstation:create') or @auth.check(authentication, 'data:create')")
    public ResponseEntity<ApiResponse<BeaconStationResponse>> create(
                    @Valid @RequestBody CreateBeaconStationRequest request) {
            BeaconStationResponse response = beaconStationService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                            .body(ApiResponse.success("Tạo đèn biển thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'beaconstation:update') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<BeaconStationResponse>> update(
                    @PathVariable UUID id,
                    @Valid @RequestBody UpdateBeaconStationRequest request) {
            return ResponseEntity.ok(ApiResponse.success(
                            "Cập nhật đèn biển thành công",
                            beaconStationService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'beaconstation:delete') or @auth.check(authentication, 'data:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
            beaconStationService.delete(id);
            return ResponseEntity.ok(
                            ApiResponse.success("Đã xóa đèn biển thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("@auth.check(authentication, 'beaconstation:create') or @auth.check(authentication, 'beaconstation:update') or @auth.check(authentication, 'data:create') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
                    @PathVariable UUID id) {
            beaconStationService.submitForApproval(id);
            return ResponseEntity.ok(
                            ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("@auth.check(authentication, 'beaconstation:approvec1') or @auth.check(authentication, 'beaconstation:approvel1') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel1')")
    public ResponseEntity<ApiResponse<BeaconStationResponse>> approveL1(
                    @PathVariable UUID id, @RequestParam java.util.UUID approverId) {
            return ResponseEntity.ok(ApiResponse.success(
                            "Phê duyệt L1 thành công",
                            beaconStationService.approveL1(id, approverId)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BeaconStationResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam java.util.UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối",
                beaconStationService.reject(id, rejectReason, approverId)));
    }

    // ── Attachment endpoints ────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> uploadAttachments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tải file đính kèm thành công",
                beaconStationService.uploadAttachments(id, files, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> listAttachments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách file đính kèm thành công",
                beaconStationService.listAttachments(id)));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        beaconStationService.deleteAttachment(id, attachmentId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa file đính kèm", null));
    }
}
