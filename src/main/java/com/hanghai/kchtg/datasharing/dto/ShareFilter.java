package com.hanghai.kchtg.datasharing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareFilter {
    private String dataType;
    private String shareStatus;
    private String sharedWith;
    private String year;
    private Integer page;
    private Integer size;
}
