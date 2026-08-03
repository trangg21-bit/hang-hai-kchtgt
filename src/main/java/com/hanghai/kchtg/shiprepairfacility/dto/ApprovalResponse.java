package com.hanghai.kchtg.shiprepairfacility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private UUID id;
    private String status;
    private String quyetDinh;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
