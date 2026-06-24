package com.hanghai.kchtg.password.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Password policy singleton table (F-276).
 * Only one row should exist at any time.
 */
@Entity
@Table(name = "password_policy")
@Getter
@Setter
@NoArgsConstructor
public class PasswordPolicy extends BaseEntity {

    @Column(nullable = false)
    private int minLength = 12;

    @Column(nullable = false)
    private boolean requireUppercase = true;

    @Column(nullable = false)
    private boolean requireLowercase = true;

    @Column(nullable = false)
    private boolean requireDigit = true;

    @Column(nullable = false)
    private boolean requireSpecialChar = true;

    @Column(name = "special_char_set", length = 128, nullable = false)
    private String specialCharSet = "!@#$%^&*()-_=+";

    @Column(name = "max_age_days", nullable = false)
    private int maxAgeDays = 90;

    @Column(name = "history_depth", nullable = false)
    private int historyDepth = 5;

    @Column(name = "block_username_in_password", nullable = false)
    private boolean blockUsernameInPassword = true;
}