package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.entity.IntegrationConnection;
import com.hanghai.kchtg.interconnect.enums.ConnectionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConnectionResponse {

    private UUID id;
    private String accountName;
    private String connectionName;
    private String senderSystem;
    private String receiverSystem;
    private ConnectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IntegrationConnectionResponse(IntegrationConnection entity) {
        this.id = entity.getId();
        this.accountName = entity.getAccountName();
        this.connectionName = entity.getConnectionName();
        this.senderSystem = entity.getSenderSystem();
        this.receiverSystem = entity.getReceiverSystem();
        this.status = entity.getStatus();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

}
