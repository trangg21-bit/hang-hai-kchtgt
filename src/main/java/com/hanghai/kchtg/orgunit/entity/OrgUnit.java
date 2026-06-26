package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

/**
 * Entity representing an organisational unit in the hierarchical org chart.
 * <p>
 * Self-referencing via {@code parentId} (nullable for root nodes).
 * Extends {@link BaseEntity} for audit fields (id, createdAt, updatedAt).
 * </p>
 */
@Entity
@Table(name = "org_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgUnit extends BaseEntity {

    /**
     * Display name of the organisational unit (max 200 chars).
     */
    @NotBlank(message = "Tên đơn vị không được để trống")
    @Size(max = 200, message = "Tên đơn vị tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    /**
     * Unique business code for the unit (max 50 chars).
     */
    @NotBlank(message = "Mã đơn vị không được để trống")
    @Size(max = 50, message = "Mã đơn vị tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /**
     * Parent unit ID for hierarchical organisation.
     * {@code null} indicates a root-level unit.
     */
    @Column
    private UUID parentId;

    /**
     * Organisational unit type (DEPARTMENT, DIVISION, TEAM, STATION).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrgUnitType type;

    /**
     * Physical or mailing address (max 500 chars, optional).
     */
    @Column(length = 500)
    private String address;

    /**
     * Contact phone number (max 20 chars, optional).
     */
    @Column(length = 20)
    private String phone;

    /**
     * Activation status. Defaults to {@code ACTIVE} at creation time
     * if not explicitly provided.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private OrgUnitStatus status;
}
