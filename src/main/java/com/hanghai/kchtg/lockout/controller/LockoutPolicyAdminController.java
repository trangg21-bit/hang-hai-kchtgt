package com.hanghai.kchtg.lockout.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.lockout.dto.LockoutPolicyResponse;
import com.hanghai.kchtg.lockout.service.LockoutPolicyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for lockout policy management (F-277).
 * <p>
 * GET  /api/admin/lockout-policy   - view policy (admin only)
 * PUT  /api/admin/lockout-policy   - update policy (admin only)
 * </p>
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("@auth.check(authentication, 'security:manage')")
public class LockoutPolicyAdminController {

    private final LockoutPolicyService policyService;

    public LockoutPolicyAdminController(LockoutPolicyService policyService) {
        this.policyService = policyService;
    }

    /**
     * GET /api/admin/lockout-policy - view current lockout policy.
     */
    @GetMapping("/lockout-policy")
    public ResponseEntity<ApiResponse<LockoutPolicyResponse>> getLockoutPolicy() {
        var policy = policyService.getPolicy();
        var response = policyService.toResponse(policy);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/admin/lockout-policy - update lockout policy.
     */
    @PutMapping("/lockout-policy")
    public ResponseEntity<ApiResponse<LockoutPolicyResponse>> updateLockoutPolicy(
            @RequestBody com.hanghai.kchtg.lockout.dto.LockoutPolicyUpdateRequest request) {
        var policy = new com.hanghai.kchtg.lockout.entity.LockoutPolicy();
        policy.setMaxFailedAttempts(request.getMaxFailedAttempts());
        policy.setLockoutDurationMinutes(request.getLockoutDurationMinutes());
        policy.setWindowMinutes(request.getWindowMinutes());
        policy.setEnabled(request.isEnabled());

        var updated = policyService.updatePolicy(policy);
        var response = policyService.toResponse(updated);
        return ResponseEntity.ok(ApiResponse.success("Chính sách giới hạn đăng nhập đã được cập nhật", response));
    }
}