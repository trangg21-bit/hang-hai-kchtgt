package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.entity.IntegrationConnection;
import com.hanghai.kchtg.interconnect.enums.ConnectionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public class IntegrationConnectionResponse {

    private UUID id;
    private String accountName;
    private String connectionName;
    private String senderSystem;
    private String receiverSystem;
    private ConnectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IntegrationConnectionResponse() {
    }

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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getConnectionName() {
        return connectionName;
    }

    public void setConnectionName(String connectionName) {
        this.connectionName = connectionName;
    }

    public String getSenderSystem() {
        return senderSystem;
    }

    public void setSenderSystem(String senderSystem) {
        this.senderSystem = senderSystem;
    }

    public String getReceiverSystem() {
        return receiverSystem;
    }

    public void setReceiverSystem(String receiverSystem) {
        this.receiverSystem = receiverSystem;
    }

    public ConnectionStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectionStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
