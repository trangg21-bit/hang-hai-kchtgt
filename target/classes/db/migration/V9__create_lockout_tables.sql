-- V1: Create lockout tables
CREATE TABLE lockout_policies (
    id BIGINT NOT NULL PRIMARY KEY,
    max_failed_attempts INT NOT NULL DEFAULT 5,
    lockout_duration_minutes INT NOT NULL DEFAULT 30,
    window_minutes INT NOT NULL DEFAULT 15,
    is_enabled BIT NOT NULL DEFAULT 1,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_by UNIQUEIDENTIFIER NULL
);

-- Seed default policy
INSERT INTO lockout_policies (id, max_failed_attempts, lockout_duration_minutes, window_minutes, is_enabled)
VALUES (1, 5, 30, 15, 1);

-- Singleton guard
CREATE TRIGGER trg_lockout_policies_singleton_guard
ON lockout_policies
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF (SELECT COUNT(*) FROM lockout_policies) > 1
    BEGIN
        RAISERROR('LockoutPolicies table must contain exactly one row.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;

CREATE TABLE login_attempts (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NULL,
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NULL,
    ip_address NVARCHAR(45) NULL,
    user_agent NVARCHAR(500) NULL,
    result NVARCHAR(20) NOT NULL,
    failure_reason NVARCHAR(255) NULL,
    occurred_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE login_attempt_logs (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    login_attempt_id UNIQUEIDENTIFIER NOT NULL,
    event_type NVARCHAR(30) NOT NULL,
    triggered_by UNIQUEIDENTIFIER NULL,
    details NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_login_attempt_logs_attempt FOREIGN KEY (login_attempt_id)
        REFERENCES login_attempts(id) ON DELETE CASCADE
);