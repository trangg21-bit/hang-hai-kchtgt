package com.hanghai.kchtg.orgunit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
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
    private String code;
    private UUID parentId;
    private OrgUnitStatus status;
    private OperationalStatus operationalStatus;
    private String description;
    private String address;
    private String detailAddress;
    private String phone;
    private String contactPerson;
    private String path;
    private Integer level;
    private Integer sortOrder;
    private LocalDateTime approvedAt;
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
                .code(entity.getCode())
                .parentId(entity.getParentId())
                .status(entity.getStatus())
                .operationalStatus(entity.getOperationalStatus())
                .description(entity.getDescription())
                .address(entity.getAddress())
                .detailAddress(entity.getDetailAddress())
                .phone(entity.getPhone())
                .contactPerson(entity.getContactPerson())
                .path(entity.getPath())
                .level(entity.getLevel())
                .sortOrder(entity.getSortOrder())
                .approvedAt(entity.getApprovedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }
}
