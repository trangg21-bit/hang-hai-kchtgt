package com.hanghai.kchtg.user.exception;

/**
 * Ngoại lệ khi email đã có yêu cầu đăng ký đang chờ xử lý.
 * <p>
 * BR-001-09: một email chỉ được có một pending request tại một thời điểm.
 * </p>
 */
public class AccountPendingApprovalException extends RuntimeException {

    public AccountPendingApprovalException(String message) {
        super(message);
    }
}
