package com.hanghai.kchtg.orgunit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO representing an eligible parent candidate for creating or updating an organizational unit.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CandidateParentResponse {

    private UUID id;
    private String name;
    private Integer level;
    private OrgUnitRank rank;
    private boolean currentParent;
    private boolean disabled;
    private String disabledReason;
}
