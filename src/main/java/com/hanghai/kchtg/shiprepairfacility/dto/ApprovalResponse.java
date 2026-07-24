package com.hanghai.kchtg.shiprepairfacility.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private Long id;
    private String status;
    private String quyetDinh;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
