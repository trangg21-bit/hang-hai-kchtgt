package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho quyết định phê duyệt/từ chối yêu cầu đăng ký.
 * <p>
 * Dùng cho endpoint POST /api/v1/users/{id}/approve và /api/v1/users/{id}/reject.
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDecisionRequest {

    /** Lý do từ chối (dùng khi reject). */
    @Size(max = 500, message = "Lý do từ chối tối đa 500 ký tự")
    private String reason;
}
