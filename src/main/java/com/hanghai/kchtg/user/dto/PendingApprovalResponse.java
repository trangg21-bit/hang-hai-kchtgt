package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.PendingApproval;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin yêu cầu phê duyệt.
 * <p>
 * Dùng cho các endpoint GET /api/v1/users/pending và GET /api/v1/users/{id}/pending-status.
 * </p>
 */
@Data
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
     * Tạo response từ entity {@link PendingApproval}.
     */
    public static PendingApprovalResponse from(PendingApproval pa) {
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
