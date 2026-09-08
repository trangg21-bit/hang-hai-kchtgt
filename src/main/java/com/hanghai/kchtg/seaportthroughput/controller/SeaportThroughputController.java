package com.hanghai.kchtg.seaportthroughput.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.dto.ApprovalRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.seaportthroughput.dto.SearchResultResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputCreateRequest;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputFileResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputImportResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputUpdateRequest;
import com.hanghai.kchtg.seaportthroughput.service.SeaportThroughputService;
import com.hanghai.kchtg.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * REST controller Sản lượng cảng biển (M-028 / F-301) — base /api/v1/seaport-throughput.
 * Mọi endpoint yêu cầu quyền {@code seaportthroughput:<action>} và DataScope theo đơn vị.
 */
@RestController
@RequestMapping("/api/v1/seaport-throughput")
@RequiredArgsConstructor
@DataScope
public class SeaportThroughputController {

    private final SeaportThroughputService service;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:read')")
    public ResponseEntity<ApiResponse<SearchResultResponse>> search(
            @RequestParam(name = "orgUnitId", required = false) UUID orgUnitId,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @RequestParam(name = "reportMonth", required = false) String reportMonth,
            @RequestParam(name = "updatedFrom", required = false) LocalDateTime updatedFrom,
            @RequestParam(name = "updatedTo", required = false) LocalDateTime updatedTo,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        List<ApprovalStatus> statuses = null;
        if (approvalStatus != null && !approvalStatus.trim().isEmpty()) {
            statuses = Arrays.stream(approvalStatus.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(this::parseApprovalStatus)
                    .toList();
        }
        YearMonth month = null;
        if (reportMonth != null && !reportMonth.trim().isEmpty()) {
            try {
                month = YearMonth.parse(reportMonth.trim());
            } catch (Exception ignored) {
                // lọc tháng sai định dạng được bỏ qua — giữ hành vi liệt kê mặc định
            }
        }
        return ResponseEntity.ok(ApiResponse.success(service.search(
                orgUnitId, statuses, month, updatedFrom, updatedTo, keyword, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:read')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:read')")
    public ResponseEntity<ApiResponse<List<InfrastructureHistory>>> getHistory(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getHistory(id)));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:create')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> create(
            @RequestBody SeaportThroughputCreateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tạo mới sản lượng cảng biển thành công",
                service.create(request, currentUserId(authentication))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:update')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> update(
            @PathVariable UUID id,
            @RequestBody SeaportThroughputUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật sản lượng cảng biển thành công",
                service.update(id, request, currentUserId(authentication))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
                                                    Authentication authentication) {
        service.delete(id, currentUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Xóa bản ghi sản lượng cảng biển thành công", null));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:submit')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> submit(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Gửi phê duyệt sản lượng cảng biển thành công",
                service.submit(id, currentUserId(authentication))));
    }

    @PostMapping("/{id}/approve/c1")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:approve')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> approveLevel1(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt sản lượng cảng biển thành công",
                service.approveLevel1(id, request, currentUserId(authentication))));
    }

    @PostMapping("/{id}/approve/c2")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:approve_level2')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> approveLevel2(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ban hành sản lượng cảng biển thành công",
                service.approveLevel2(id, request, currentUserId(authentication))));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:reject')")
    public ResponseEntity<ApiResponse<SeaportThroughputResponse>> reject(
            @PathVariable UUID id,
            @RequestBody ApprovalRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Từ chối sản lượng cảng biển thành công",
                service.reject(id, request, currentUserId(authentication))));
    }

    @PostMapping("/import")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:import')")
    public ResponseEntity<ApiResponse<SeaportThroughputImportResponse>> importExcel(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        SeaportThroughputImportResponse result = service.importExcel(file, currentUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success(
                "Nhập dữ liệu sản lượng cảng biển thành công: " + result.getImportedRows() + " dòng",
                result));
    }

    @PostMapping("/{id}/files")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:update')")
    public ResponseEntity<ApiResponse<List<SeaportThroughputFileResponse>>> uploadFiles(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đính kèm file thành công",
                service.uploadFiles(id, files, currentUserId(authentication))));
    }

    @DeleteMapping("/{id}/files/{fileId}")
    @PreAuthorize("@auth.check(authentication, 'seaportthroughput:update')")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable UUID id,
            @PathVariable UUID fileId,
            Authentication authentication) {
        service.deleteFile(id, fileId, currentUserId(authentication));
        return ResponseEntity.ok(ApiResponse.success("Xóa file đính kèm thành công", null));
    }

    private ApprovalStatus parseApprovalStatus(String value) {
        try {
            return ApprovalStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái phê duyệt không hợp lệ: " + value);
        }
    }

    private UUID currentUserId(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
    }
}
