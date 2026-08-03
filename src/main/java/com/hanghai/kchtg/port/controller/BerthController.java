package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.berth.ApproveRequest;
import com.hanghai.kchtg.port.dto.berth.BerthResponse;
import com.hanghai.kchtg.port.dto.berth.CreateBerthRequest;
import com.hanghai.kchtg.port.dto.berth.RejectRequest;
import com.hanghai.kchtg.port.dto.berth.UpdateBerthRequest;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.service.BerthApprovalService;
import com.hanghai.kchtg.port.service.BerthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/berths")
@RequiredArgsConstructor
@Slf4j
@Validated
public class BerthController {

    private final BerthService berthService;
    private final BerthApprovalService berthApprovalService;
    private final PierRepository pierRepository;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'berth:create')")
    public ResponseEntity<ApiResponse<BerthResponse>> create(
            @Valid @RequestBody CreateBerthRequest request) {
        log.info("Creating Berth: code={}", request.getBerthCode());
        BerthResponse response = berthService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới bến cảng thành công", response));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'berth:create')")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> generateCode(
            @RequestParam UUID portId) {
        log.info("Generating berth code for portId={}", portId);
        String code = berthService.generateBerthCode(portId);
        return ResponseEntity.ok(ApiResponse.success("Sinh mã bến thành công", java.util.Map.of("berthCode", code)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'berth:read')")
    public ResponseEntity<ApiResponse<BerthResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Berth by id={}", id);
        BerthResponse response = berthService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin bến cảng thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'berth:read')")
    public ResponseEntity<ApiResponse<Page<BerthResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String berthCode,
            @RequestParam(required = false) String berthName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) String waterway,
            @RequestParam(required = false) String berthType,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus) {
        log.info("Listing Berths: page={}, size={}, orgUnitId={}, search={}, berthCode={}, berthName={}, portId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, berthCode, berthName, portId, operationalStatus, approvalStatus);
        Page<BerthResponse> result = berthService.findAll(page, size, orgUnitId,
                berthCode, berthName, portId, waterway, berthType, operationalStatus, approvalStatus, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bến cảng thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'berth:update')")
    public ResponseEntity<ApiResponse<BerthResponse>> update(
            @Valid @RequestBody UpdateBerthRequest request) {
        log.info("Updating Berth: id={}", request.getId());
        BerthResponse response = berthService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bến cảng thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'berth:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Berth: id={}", id);
        berthService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bến cảng thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'berth:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRequest request,
            Authentication authentication) {
        log.info("Approving Berth: id={}, cap={}", id, request.getCap());
        berthApprovalService.approve(id, authentication.getName(), request.getCap());
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bến cảng thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'berth:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        log.info("Rejecting Berth: id={}, cap={}", id, request.getCap());
        berthApprovalService.reject(id, authentication.getName(), request.getCap(), request.getLyDo());
        return ResponseEntity.ok(ApiResponse.success("Từ chối bến cảng thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'berth:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Berth history: id={}", id);
        Object history = berthApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử bến cảng thành công", history));
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("@auth.check(authentication, 'berth:read')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getChildren(@PathVariable UUID id) {
        long cauCangCount = pierRepository.countByBerthIdAndDeletedAtIsNull(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công", java.util.Map.of("cauCangCount", cauCangCount)));
    }
}
