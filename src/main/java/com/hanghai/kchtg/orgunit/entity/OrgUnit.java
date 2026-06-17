package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    @NotBlank(message = "Ten don vi khong duoc de trong")
    @Size(max = 200, message = "Ten don vi toi da 200 ky tu")
    @Column(nullable = false, length = 200)
    private String name;

    /**
     * Unique business code for the unit (max 50 chars).
     */
    @NotBlank(message = "Ma don vi khong duoc de trong")
    @Size(max = 50, message = "Ma don vi toi da 50 ky tu")
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
