package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.entity.DataSharingLog;

import java.time.LocalDateTime;
import java.util.UUID;

public class DataSharingLogResponse {

    private UUID id;
    private String transactionCode;
    private String accountName;
    private String connectionName;
    private String senderSystem;
    private String receiverSystem;
    private String status;
    private String detailContent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DataSharingLogResponse() {
    }

    public DataSharingLogResponse(DataSharingLog entity) {
        this.id = entity.getId();
        this.transactionCode = entity.getTransactionCode();
        this.accountName = entity.getAccountName();
        this.connectionName = entity.getConnectionName();
        this.senderSystem = entity.getSenderSystem();
        this.receiverSystem = entity.getReceiverSystem();
        this.status = entity.getStatus();
        this.detailContent = entity.getDetailContent();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetailContent() {
        return detailContent;
    }

    public void setDetailContent(String detailContent) {
        this.detailContent = detailContent;
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
