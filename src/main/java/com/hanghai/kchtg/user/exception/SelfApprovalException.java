package com.hanghai.kchtg.user.exception;

/**
 * Ngoại lệ khi admin cố gắng phê duyệt/từ chối yêu cầu đăng ký của chính mình.
 * <p>
 * BR-001-11 yêu cầu anti-self-approval guard.
 * </p>
 */
public class SelfApprovalException extends RuntimeException {

    public SelfApprovalException(String message) {
        super(message);
    }
}
