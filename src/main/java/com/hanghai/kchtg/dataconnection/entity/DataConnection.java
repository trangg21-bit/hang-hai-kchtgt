package com.hanghai.kchtg.dataconnection.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.enums.SyncFrequency;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represents an external system data connection (liên thông / chia sẻ dữ liệu).
 * <p>
 * Stores connection metadata including endpoint, authentication type, encrypted
 * credentials, sync frequency, and operational status.
 * </p>
 */
@Entity
@Table(name = "data_connections")
@Getter
@Setter
public class DataConnection extends BaseEntity {

    /** Human-readable display name of the connection. */
    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String name;

    /** Unique business code for the connection (e.g. "DC-HQ", "DC-TV"). */
    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Descriptive label of the target system (e.g. "Hệ thống hải quan"). */
    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String targetSystem;

    /** Protocol/type of the connection. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConnectionType connectionType;

    /** Base URL / endpoint for the target system. */
    @Size(max = 1024)
    @Column(length = 1024)
    private String endpointUrl;

    /** Authentication mechanism. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthType authType;

    /**
     * Encrypted credentials (token, password, certificate thumbprint, etc.).
     * Stored as encrypted text; plain-text must never be persisted.
     */
    @Column(columnDefinition = "TEXT")
    private String credentials;

    /** Data synchronisation cadence. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SyncFrequency syncFrequency;

    /** Current operational status. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConnectionStatus status;

    /** Timestamp of the most recent successful sync. */
    @Column
    private LocalDateTime lastSyncAt;
}
