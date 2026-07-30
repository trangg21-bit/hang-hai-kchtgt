package com.hanghai.kchtg.port.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.berth.*;
import com.hanghai.kchtg.port.service.BerthApprovalService;
import com.hanghai.kchtg.port.service.BerthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/berths")
@RequiredArgsConstructor
@Slf4j
@Validated
public class BerthController {

    private final BerthService berthService;
    private final BerthApprovalService berthApprovalService;

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'berth:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        log.info("Generating next berth code");
        Map<String, String> result = berthService.generateCode();
        return ResponseEntity.ok(ApiResponse.success("Tạo mã bến mới thành công", result));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'berth:create')")
    public ResponseEntity<ApiResponse<BerthResponse>> create(
            @Valid @RequestBody CreateBerthRequest request) {
        log.info("Creating Berth: name={}, action={}", request.getBerthName(), request.getAction());
        BerthResponse response = berthService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới bến cảng thành công", response));
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
            @RequestParam(required = false) String portStatus) {
        log.info("Listing Berths: page={}, size={}, orgUnitId={}, search={}, berthCode={}, berthName={}, portId={}, portStatus={}",
                page, size, orgUnitId, search, berthCode, berthName, portId, portStatus);
        Page<BerthResponse> result = berthService.findAll(page, size, orgUnitId,
                berthCode, berthName, portId, waterway, berthType, portStatus, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bến cảng thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'berth:update')")
    public ResponseEntity<ApiResponse<BerthResponse>> update(
            @Valid @RequestBody UpdateBerthRequest request) {
        log.info("Updating Berth: id={}", request.getId());
        BerthResponse response = berthService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công — chờ phê duyệt lại", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'berth:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Berth: id={}", id);
        berthService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bến cảng thành công", null));
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("@auth.check(authentication, 'berth:read')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getChildren(@PathVariable UUID id) {
        log.info("Getting Berth children count: id={}", id);
        Map<String, Long> result = berthService.getChildrenCount(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin bến con thành công", result));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'berth:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving Berth: id={}, userId={}", id, userId);
        berthApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bến cảng thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'berth:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting Berth: id={}, userId={}", id, userId);
        berthApprovalService.reject(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối bến cảng thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'berth:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Berth history: id={}", id);
        Object history = berthApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử bến cảng thành công", history));
    }
}
