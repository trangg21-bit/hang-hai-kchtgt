package com.hanghai.kchtg.accesslog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogAggregateResponse {

    private Long id;
    private String date;
    private Long totalAccesses;
    private Long uniqueUsers;
    private String successRate;
    private Integer avgDuration;
    private String createdAt;

}
