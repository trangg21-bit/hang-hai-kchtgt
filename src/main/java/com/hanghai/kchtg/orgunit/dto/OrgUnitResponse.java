package com.hanghai.kchtg.orgunit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing an organisational unit.
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
    private String address;
    private String phone;
    private OrgUnitStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Child units - populated by the tree-building service logic.
     * Omitted from flat list responses.
     */
    private List<OrgUnitResponse> children;

    /**
     * Static factory: map entity → response (without children).
     *
     * @param entity the JPA entity
     * @return response DTO with all scalar fields populated
     */
    public static OrgUnitResponse from(OrgUnit entity) {
        return OrgUnitResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .parentId(entity.getParentId())
                .type(entity.getType())
                .address(entity.getAddress())
                .phone(entity.getPhone())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}