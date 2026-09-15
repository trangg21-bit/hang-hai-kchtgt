package com.hanghai.kchtg.vtssystem.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Small response used by mutations; detail collections are fetched separately. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VtsSystemMutationResponse {
    private UUID id;
    private String code;
    private ApprovalStatus approvalStatus;
    private LocalDateTime updatedDate;

    public static VtsSystemMutationResponse from(VtsSystemResponse response) {
        if (response == null) {
            return null;
        }
        return VtsSystemMutationResponse.builder()
                .id(response.getId())
                .code(response.getCode())
                .approvalStatus(response.getApprovalStatus())
                .updatedDate(response.getUpdatedDate())
                .build();
    }
}
