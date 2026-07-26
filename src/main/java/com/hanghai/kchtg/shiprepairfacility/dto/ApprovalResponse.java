package com.hanghai.kchtg.shiprepairfacility.dto;

import java.util.UUID;

import lombok.*;
import java.time.LocalDateTime;

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
