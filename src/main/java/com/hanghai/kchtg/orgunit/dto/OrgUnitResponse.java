package com.hanghai.kchtg.orgunit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing an organisational unit with full materialized-path metadata.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class OrgUnitResponse {

    private UUID id;
    private String name;
    private UUID parentId;
    private OperationalStatus operationalStatus;
    private OrgUnitRank rank;
    private String description;
    private Integer provinceId;
    private String detailAddress;
    private String phone;
    private String path;
    private Integer level;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** User who last updated (username from auditing). null if never updated. */
    private UUID updatedBy;

    /** Child units — populated by tree-building logic. Omitted from flat list responses. */
    private List<OrgUnitResponse> children;

    /**
     * Static factory: map entity → response (without children).
     */
    public static OrgUnitResponse from(OrgUnit entity) {
        return OrgUnitResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .parentId(entity.getParentId())
                .operationalStatus(entity.getOperationalStatus())
                .rank(entity.getRank())
                .description(entity.getDescription())
                .provinceId(entity.getProvinceId())
                .detailAddress(entity.getDetailAddress())
                .phone(entity.getPhone())
                .path(entity.getPath())
                .level(entity.getLevel())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }
}
