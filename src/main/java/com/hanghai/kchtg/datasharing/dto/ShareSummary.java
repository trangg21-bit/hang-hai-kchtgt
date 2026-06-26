package com.hanghai.kchtg.datasharing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareSummary {
    private Long totalShared;
    private Long activeShares;
    private Long revokedShares;
    private Long expiredShares;
    private Integer totalRecords;
}
