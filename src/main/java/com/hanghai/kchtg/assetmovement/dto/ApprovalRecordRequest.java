package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Luu Phe Duyet (create/update).
 */
@Data
public class ApprovalRecordRequest {

    private UUID requestId;
    private String loaiYeuCau;
    private String result;
    private String approverName;
    private String notes;
}
