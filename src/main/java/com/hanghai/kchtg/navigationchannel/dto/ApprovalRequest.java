package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Approval request for NavigationChannel (F-039, F-040).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequest {

    private ApprovalLevel approvalLevel;

    @NotBlank(message = "Trạng thái không được để trống")
    private String status;

    private String reason;
}
