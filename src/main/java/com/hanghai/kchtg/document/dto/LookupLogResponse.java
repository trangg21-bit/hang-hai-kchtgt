package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LookupLogResponse {

    private UUID id;
    private String searchedBy;
    private String keyword;
    private String filters;
    private Integer resultCount;
    private LocalDateTime searchedAt;
}
