package com.hanghai.kchtg.datasharing.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkShareRequest {
    @NotEmpty
    private List<SharedDataRequest> shares;
    private String approvedBy;
}
