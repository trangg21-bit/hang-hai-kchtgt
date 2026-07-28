package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.entity.IntegrationTransaction;

import java.time.LocalDateTime;
import java.util.UUID;

public class IntegrationTransactionResponse {

    private UUID id;
    private UUID connectionId;
    private String type;
    private String name;
    private String referenceNumber;
    private LocalDateTime sentAt;
    private String purpose;
    private String organizationUnit;
    private String sender;
    private LocalDateTime receivedAt;
    private String receiverCode;
    private String sentContent;
    private String receivedContent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IntegrationTransactionResponse() {
    }

    public IntegrationTransactionResponse(IntegrationTransaction entity) {
        this.id = entity.getId();
        this.connectionId = entity.getConnectionId();
        this.type = entity.getType();
        this.name = entity.getName();
        this.referenceNumber = entity.getReferenceNumber();
        this.sentAt = entity.getSentAt();
        this.purpose = entity.getPurpose();
        this.organizationUnit = entity.getOrganizationUnit();
        this.sender = entity.getSender();
        this.receivedAt = entity.getReceivedAt();
        this.receiverCode = entity.getReceiverCode();
        this.sentContent = entity.getSentContent();
        this.receivedContent = entity.getReceivedContent();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(UUID connectionId) {
        this.connectionId = connectionId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getOrganizationUnit() {
        return organizationUnit;
    }

    public void setOrganizationUnit(String organizationUnit) {
        this.organizationUnit = organizationUnit;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }

    public String getReceiverCode() {
        return receiverCode;
    }

    public void setReceiverCode(String receiverCode) {
        this.receiverCode = receiverCode;
    }

    public String getSentContent() {
        return sentContent;
    }

    public void setSentContent(String sentContent) {
        this.sentContent = sentContent;
    }

    public String getReceivedContent() {
        return receivedContent;
    }

    public void setReceivedContent(String receivedContent) {
        this.receivedContent = receivedContent;
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
