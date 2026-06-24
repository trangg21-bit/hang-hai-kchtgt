package com.hanghai.kchtg.user.entity;

/**
 * Ket qua cua mot lan attempt dang nhap (audit).
 */
public enum LoginAttemptResult {

    /** Dang nhap thanh cong */
    SUCCESS,

    /** Dang nhap that bai (sai mat khau, sai TOTP, tai khoan khoa, …) */
    FAIL
}