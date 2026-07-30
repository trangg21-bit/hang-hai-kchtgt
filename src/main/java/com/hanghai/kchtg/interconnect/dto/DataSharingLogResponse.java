package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.entity.DataSharingLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
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

}
