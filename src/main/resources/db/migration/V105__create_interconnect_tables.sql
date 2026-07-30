-- ====================================================================
-- Migration V103: Create interconnect (F-004) tables
--
-- F-004: Interconnect and data sharing with external systems
--
-- Creates 3 tables:
--   1. integration_connections        - Kết nối tích hợp với hệ thống ngoài
--   2. integration_transactions       - Giao dịch tích hợp gửi/nhận dữ liệu
--   3. data_sharing_logs              - Nhật ký chia sẻ dữ liệu
--
-- All tables include BaseEntity audit fields (created_at, updated_at,
-- deleted_at, deleted_by, created_by, updated_by).
-- This migration MUST run BEFORE V104 (seed data).
-- All CREATEs use IF NOT EXISTS for idempotency.
-- ====================================================================

-- 1. integration_connections: định nghĩa kết nối đến hệ thống tích hợp
CREATE TABLE IF NOT EXISTS public.integration_connections (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    account_name    VARCHAR(255) NOT NULL,
    connection_name VARCHAR(255) NOT NULL,
    sender_system   VARCHAR(255) NOT NULL,
    receiver_system VARCHAR(255) NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    password        TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    deleted_by      UUID,
    created_by      UUID,
    updated_by      UUID
);

-- 2. integration_transactions: lịch sử giao dịch gửi/nhận qua kết nối
CREATE TABLE IF NOT EXISTS public.integration_transactions (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id       UUID        NOT NULL REFERENCES public.integration_connections(id),
    type                VARCHAR(50)  NOT NULL,
    name                VARCHAR(255) NOT NULL,
    reference_number    VARCHAR(100),
    sent_at             TIMESTAMP,
    purpose             VARCHAR(500),
    organization_unit   VARCHAR(255),
    sender              VARCHAR(255),
    received_at         TIMESTAMP,
    receiver_code       VARCHAR(100),
    sent_content        TEXT,
    received_content    TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP,
    deleted_by          UUID,
    created_by          UUID,
    updated_by          UUID
);
CREATE INDEX IF NOT EXISTS idx_it_connection_id ON public.integration_transactions(connection_id);

-- 3. data_sharing_logs: nhật ký chia sẻ dữ liệu giữa các hệ thống
CREATE TABLE IF NOT EXISTS public.data_sharing_logs (
    id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_code  VARCHAR(100) NOT NULL,
    account_name      VARCHAR(255) NOT NULL,
    connection_name   VARCHAR(255) NOT NULL,
    sender_system     VARCHAR(255) NOT NULL,
    receiver_system   VARCHAR(255) NOT NULL,
    status            VARCHAR(50)  NOT NULL,
    detail_content    TEXT,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMP,
    deleted_by        UUID,
    created_by        UUID,
    updated_by        UUID
);
