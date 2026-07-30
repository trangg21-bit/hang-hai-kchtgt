package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.entity.IntegrationTransaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
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
}
