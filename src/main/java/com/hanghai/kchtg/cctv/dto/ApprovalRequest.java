package com.hanghai.kchtg.cctv.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotBlank(message = "Quyết định phê duyệt không được để trống")
    @JsonAlias("quyetDinh")
    private String decision;

    @Size(max = 500)
    private String reason;

    @AssertTrue(message = "Lý do từ chối là bắt buộc")
    public boolean isReasonValid() {
        return !ApprovalStatus.REJECTED.name().equalsIgnoreCase(decision)
                || (reason != null && !reason.trim().isEmpty());
    }
}
