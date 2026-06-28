package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin yêu cầu phê duyệt.
 * <p>
 * Dùng cho các endpoint GET /api/v1/users/pending và GET /api/v1/users/{id}/pending-status.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PendingApprovalResponse {

    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String status;
    private String requestedRoleCode;
    private LocalDateTime createdAt;

    /**
     * Tạo response từ entity {@link com.hanghai.kchtg.user.entity.PendingApproval}.
     */
    public static PendingApprovalResponse from(com.hanghai.kchtg.user.entity.PendingApproval pa) {
        PendingApprovalResponse resp = new PendingApprovalResponse();
        resp.setId(pa.getId().toString());
        resp.setUsername(pa.getUsername());
        resp.setEmail(pa.getEmail());
        resp.setFullName(pa.getFullName());
        resp.setPhone(pa.getPhone());
        resp.setStatus(pa.getStatus());
        resp.setRequestedRoleCode(pa.getRequestedRoleCode());
        resp.setCreatedAt(pa.getCreatedAt());
        return resp;
    }
}
