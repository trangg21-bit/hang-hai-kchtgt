package com.hanghai.kchtg.admin.controller;

import com.hanghai.kchtg.admin.dto.AdminResponse;
import com.hanghai.kchtg.admin.dto.CreateAdminRequest;
import com.hanghai.kchtg.admin.dto.UpdateAdminRequest;
import com.hanghai.kchtg.admin.service.AdminAccountService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin-accounts")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<ApiResponse<AdminResponse>> findByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(service.findByUserId(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminResponse>> create(
            @Valid @RequestBody CreateAdminRequest request) {
        AdminResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AdminAccount created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("AdminAccount deleted", null));
    }
}
