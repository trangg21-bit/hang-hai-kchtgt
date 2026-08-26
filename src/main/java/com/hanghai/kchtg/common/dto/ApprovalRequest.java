package com.hanghai.kchtg.common.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.util.StringUtils;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

/**
 * DTO chuẩn dùng chung cho các request thao tác phê duyệt (C1, C2) và từ chối.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class ApprovalRequest {

    @JsonAlias("quyetDinh")
    private String decision;

    @Size(max = 1000, message = "Ý kiến/Lý do phê duyệt tối đa 1000 ký tự")
    @JsonAlias({"lyDo", "rejectReason"})
    private String reason;

    public String resolveDecision(ApprovalStatus defaultStatus) {
        if (StringUtils.isBlank(decision)) {
            return defaultStatus != null ? defaultStatus.name() : ApprovalStatus.APPROVED.name();
        }
        return decision.trim().toUpperCase();
    }

    public String resolveDecision() {
        return resolveDecision(ApprovalStatus.APPROVED);
    }

    public String resolveReason(String defaultReason) {
        return StringUtils.defaultIfBlank(reason, defaultReason);
    }

    public String resolveReason() {
        return StringUtils.trimToNull(reason);
    }
}
