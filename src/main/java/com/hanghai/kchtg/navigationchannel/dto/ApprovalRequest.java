package com.hanghai.kchtg.navigationchannel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Approval request for NavigationChannel (F-039, F-040).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequest {

    private Integer approvalLevel;

    @NotBlank(message = "Trang thai khong duoc de trong")
    private String status;

    private String reason;
}
