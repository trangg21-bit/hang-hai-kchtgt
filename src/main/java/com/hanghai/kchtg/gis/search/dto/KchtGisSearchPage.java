package com.hanghai.kchtg.gis.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KchtGisSearchPage {
    private List<KchtGisSearchResult> content;
    private long totalElements;
    private int page;
    private int size;
}
