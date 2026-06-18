package com.hanghai.kchtg.dataconnection.dto;

import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.enums.SyncFrequency;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only projection of a {@link DataConnection} for API responses.
 * Credentials are never exposed.
 */
@Value
@Builder
public class ConnectionResponse {
    UUID id;
    String name;
    String code;
    String targetSystem;
    ConnectionType connectionType;
    String endpointUrl;
    AuthType authType;
    SyncFrequency syncFrequency;
    ConnectionStatus status;
    LocalDateTime lastSyncAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    /**
     * Factory method: maps entity → response (credentials omitted).
     */
    public static ConnectionResponse fromEntity(DataConnection entity) {
        return ConnectionResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .targetSystem(entity.getTargetSystem())
                .connectionType(entity.getConnectionType())
                .endpointUrl(entity.getEndpointUrl())
                .authType(entity.getAuthType())
                .syncFrequency(entity.getSyncFrequency())
                .status(entity.getStatus())
                .lastSyncAt(entity.getLastSyncAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
