package com.hanghai.kchtg.user.entity;

/**
 * Loại attempts dang nhap de ghi nhan vao audit log.
 */
public enum LoginAttemptType {

    /** Attempt dang nhap bang ten dang nhap/mat khau */
    CREDENTIALS,

    /** Attempt xac thuc code TOTP 2-pha */
    TOTP
}