package com.hanghai.kchtg.port.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Entity đại diện cho Khu bến thuộc Cảng biển (M-002).
 * Bảng: port_wharf_areas.
 */
@Entity
@Table(name = "port_wharf_areas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
public class PortWharfArea extends BaseEntity {

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id", insertable = false, updatable = false)
    @JsonBackReference
    private Port port;

    @Column(name = "wharf_code", nullable = false, length = 50)
    private String wharfCode;

    @Column(name = "wharf_name", nullable = false, length = 255)
    private String wharfName;

    @Column(name = "main_planning_function", length = 500)
    private String mainPlanningFunction;

    @Column(name = "planning_scope", length = 2000)
    private String planningScope;

    @Column(name = "regulatory_document", length = 2000)
    private String regulatoryDocument;

    @Column(name = "notes", length = 2000)
    private String notes;
}
