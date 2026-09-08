package com.hanghai.kchtg.shipportcall.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.shipportcall.dto.ShipPortCallCreateRequest;
import com.hanghai.kchtg.shipportcall.dto.ShipPortCallResponse;
import com.hanghai.kchtg.shipportcall.service.ShipPortCallService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

/**
 * REST controller for the ship port call register (F-300 «Tàu biển ra vào cảng biển»).
 * Class-level {@code @DataScope} activates the orgUnitFilter Hibernate filter so list queries
 * are implicitly scoped to the caller's org-unit subtree (Cục/Admin sees full). Each action is
 * permission-checked: {@code shipportcall:read} on GET, {@code shipportcall:create} on POST.
 */
@RestController
@RequestMapping("/api/v1/ship-port-call")
@DataScope
@RequiredArgsConstructor
public class ShipPortCallController {

    private final ShipPortCallService service;

    /**
     * Danh sách bản ghi tàu biển ra vào cảng biển (phân trang + bộ lọc org unit / 3 khoảng ngày).
     */
    @PreAuthorize("@auth.check(authentication, 'shipportcall:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ShipPortCallResponse>>> findAll(
            @RequestParam(name = "orgUnitId", required = false) UUID orgUnitId,
            @RequestParam(name = "reportDateFrom", required = false) LocalDate reportDateFrom,
            @RequestParam(name = "reportDateTo", required = false) LocalDate reportDateTo,
            @RequestParam(name = "arrivalDateFrom", required = false) LocalDate arrivalDateFrom,
            @RequestParam(name = "arrivalDateTo", required = false) LocalDate arrivalDateTo,
            @RequestParam(name = "departureDateFrom", required = false) LocalDate departureDateFrom,
            @RequestParam(name = "departureDateTo", required = false) LocalDate departureDateTo,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<ShipPortCallResponse> result = service.search(
                orgUnitId, reportDateFrom, reportDateTo,
                arrivalDateFrom, arrivalDateTo, departureDateFrom, departureDateTo,
                page, size);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách tàu biển ra vào cảng biển thành công", result));
    }

    /**
     * Tạo mới bản ghi tàu biển ra vào cảng biển (modal trên trang danh sách).
     */
    @PreAuthorize("@auth.check(authentication, 'shipportcall:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<ShipPortCallResponse>> create(
            @Valid @RequestBody ShipPortCallCreateRequest request,
            Authentication authentication) {
        ShipPortCallResponse response = service.create(request, currentUserId(authentication));
        return ResponseEntity.ok(
                ApiResponse.success("Tạo mới bản ghi tàu biển thành công", response));
    }

    private UUID currentUserId(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof User
                ? ((User) authentication.getPrincipal()).getId()
                : null;
    }
}
