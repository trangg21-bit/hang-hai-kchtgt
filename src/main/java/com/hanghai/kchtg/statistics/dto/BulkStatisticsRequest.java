package com.hanghai.kchtg.statistics.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Batch creation request for multiple statistics forms.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkStatisticsRequest {

    @NotEmpty(message = "danh sách forms không được để trống")
    private List<StatisticsFormRequest> forms;

    private String approvedBy;
}
