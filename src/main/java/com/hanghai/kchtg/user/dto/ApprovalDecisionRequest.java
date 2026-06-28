package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO cho quyết định phê duyệt/từ chối yêu cầu đăng ký.
 * <p>
 * Dùng cho endpoint POST /api/v1/users/{id}/approve và /api/v1/users/{id}/reject.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDecisionRequest {

    /** Mã vai trò gán cho người dùng khi phê duyệt (tuỳ chọn). */
    @Size(max = 50, message = "Mã vai trò tối đa 50 ký tự")
    private String roleCode;

    /** Lý do từ chối (dùng khi reject). */
    @Size(max = 500, message = "Lý do từ chối tối đa 500 ký tự")
    private String reason;
}
