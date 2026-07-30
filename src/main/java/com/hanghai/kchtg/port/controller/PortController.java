package com.hanghai.kchtg.port.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.port.*;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortApprovalService;
import com.hanghai.kchtg.port.service.PortService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ports")
@RequiredArgsConstructor
@Slf4j
@Validated
public class PortController {

    private final PortService portService;
    private final PortApprovalService portApprovalService;
    private final PortRepository portRepository;

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'port:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        log.info("Generating next port code");
        Map<String, String> result = portService.generateCode();
        return ResponseEntity.ok(ApiResponse.success("Tạo mã cảng mới thành công", result));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'port:create')")
    public ResponseEntity<ApiResponse<PortResponse>> create(
            @Valid @RequestBody CreatePortRequest request) {
        log.info("Creating Port: name={}, action={}", request.getPortName(), request.getAction());
        PortResponse response = portService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cảng biển thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<PortResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Port by id={}", id);
        PortResponse response = portService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng biển thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<Page<PortResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String portCode,
            @RequestParam(required = false) String portName,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String portStatus) {
        log.info("Listing Ports: page={}, size={}, orgUnitId={}, search={}, portCode={}, portName={}, province={}, portStatus={}",
                page, size, orgUnitId, search, portCode, portName, province, portStatus);
        Page<PortResponse> result = portService.findAll(
                page, size, orgUnitId, portCode, portName, province, portStatus, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng biển thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'port:update')")
    public ResponseEntity<ApiResponse<PortResponse>> update(
            @Valid @RequestBody UpdatePortRequest request) {
        log.info("Updating Port: id={}", request.getId());
        PortResponse response = portService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công — chờ phê duyệt lại", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'port:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Port: id={}", id);
        portService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng biển thành công", null));
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getChildren(@PathVariable UUID id) {
        log.info("Getting Port children count: id={}", id);
        Map<String, Long> result = portService.getChildrenCount(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng con thành công", result));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'port:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving Port: id={}, userId={}", id, userId);
        portApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cảng biển thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'port:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting Port: id={}, userId={}", id, userId);
        portApprovalService.reject(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng biển thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'port:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Port history: id={}", id);
        Object history = portApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng biển thành công", history));
    }

    @GetMapping("/status-counts")
    @PreAuthorize("@auth.check(authentication, 'port:read')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatusCounts() {
        log.info("Fetching port status counts");
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("NHAP", 0L); counts.put("CHO_PHE_DUYET", 0L);
        counts.put("DA_PHE_DUYET", 0L); counts.put("TU_CHOI", 0L); counts.put("TAM_NGUNG", 0L);

        List<Object[]> rows = portRepository.countByStatusGroups();
        for (Object[] row : rows) {
            ApprovalStatus as = (ApprovalStatus) row[0];
            OperationalStatus os = (OperationalStatus) row[1];
            Long cnt = (Long) row[2];
            if (as == ApprovalStatus.PENDING && os == null) counts.put("NHAP", cnt);
            else if (as == ApprovalStatus.PENDING && os == OperationalStatus.HIEN_HANH) counts.put("CHO_PHE_DUYET", cnt);
            else if (as == ApprovalStatus.APPROVED && os == OperationalStatus.HIEN_HANH) counts.put("DA_PHE_DUYET", cnt);
            else if (as == ApprovalStatus.REJECTED) counts.put("TU_CHOI", cnt);
            else if (as == ApprovalStatus.APPROVED && os == OperationalStatus.TAM_NGUNG) counts.put("TAM_NGUNG", cnt);
        }
        return ResponseEntity.ok(ApiResponse.success("OK", counts));
    }
}
