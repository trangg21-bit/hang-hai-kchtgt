package com.hanghai.kchtg.assetmovement.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Luu Phe Duyet (create/update).
 */
@Data
public class ApprovalRecordRequest {

    private UUID requestId;
    private String requestType;
    private String result;
    private String approverName;
    private String notes;

    public UUID getRequestId() { return requestId; }
    public String getResult() { return result; }
    public String getNotes() { return notes; }
}
