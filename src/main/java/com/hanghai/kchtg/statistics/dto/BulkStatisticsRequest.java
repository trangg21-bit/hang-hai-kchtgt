package com.hanghai.kchtg.statistics.dto;

import jakarta.validation.constraints.*;
import lombok.*;

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
