package com.hanghai.kchtg.admin.controller;

import com.hanghai.kchtg.admin.dto.AdminResponse;
import com.hanghai.kchtg.admin.dto.CreateAdminWithUserRequest;
import com.hanghai.kchtg.admin.dto.UpdateAdminRequest;
import com.hanghai.kchtg.admin.service.AdminAccountService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin account management - SYSTEM_ADMIN only.
 * <p>
 * Base path: {@code /api/admin-accounts}
 * </p>
 */
@RestController
@RequestMapping("/api/admin-accounts")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService service;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<AdminResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<AdminResponse>> findByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(service.findByUserId(userId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<AdminResponse>> create(
            @Valid @RequestBody CreateAdminWithUserRequest request) {
        AdminResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AdminAccount created", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<AdminResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("AdminAccount deleted", null));
    }
}
