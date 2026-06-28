package com.hanghai.kchtg.orgunit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing an organisational unit with full materialized-path metadata.
 *
 * <p>
 * The {@code children} list is populated only for tree endpoints;
 * otherwise it is omitted from JSON via {@link JsonInclude.Include#NON_EMPTY}.
 * </p>
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
    private String code;
    private UUID parentId;
    private OrgUnitType type;
    private OrgUnitStatus status;
    private String description;
    private String address;
    private String phone;
    private Double coefficient;
    private String path;
    private Integer level;
    private Long scopeId;
    private Integer sortOrder;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Child units — populated by tree-building logic. Omitted from flat list responses. */
    private List<OrgUnitResponse> children;

    /**
     * Static factory: map entity → response (without children).
     */
    public static OrgUnitResponse from(OrgUnit entity) {
        return OrgUnitResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .parentId(entity.getParentId())
                .type(entity.getType())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .address(entity.getAddress())
                .phone(entity.getPhone())
                .coefficient(entity.getCoefficient())
                .path(entity.getPath())
                .level(entity.getLevel())
                .scopeId(entity.getScopeId())
                .sortOrder(entity.getSortOrder())
                .approvedAt(entity.getApprovedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
