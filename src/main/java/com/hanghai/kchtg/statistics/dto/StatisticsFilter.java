package com.hanghai.kchtg.statistics.dto;

import lombok.*;

/**
 * Filter parameters for paginated queries on statistics forms.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsFilter {

    private String formType;
    private String formStatus;
    private String reportingPeriod;
    private String periodType;
    private String year;

    private Integer page;
    private Integer size;
}
