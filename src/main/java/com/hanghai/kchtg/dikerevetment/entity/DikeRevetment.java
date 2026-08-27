package com.hanghai.kchtg.dikerevetment.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dike_revetment")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class DikeRevetment extends BaseApprovableEntity {

    @Column(name = "dike_revetment_type")
    @Convert(converter = DikeRevetmentTypeConverter.class)
    private DikeRevetmentType dikeRevetmentType;

    @Column(name = "location", nullable = false, length = 200)
    private String location;

    @Column(name = "dike_revetment_name", length = 255)
    private String dikeRevetmentName;

    @Column(name = "code", length = 100)
    private String code;

    @Column(name = "seaport_id")
    private UUID seaportId;

    @Column(name = "length")
    private Double length;

    @Column(name = "crest_elevation")
    private Double crestElevation;

    @Column(name = "commissioning_date")
    private LocalDate commissioningDate;

    @Column(name = "height")
    private Double height;

    @Column(name = "surface_material", length = 100)
    private String surfaceMaterial;

    @Column(name = "status", length = 100)
    private String status;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "is_approved_level1", nullable = false)
    @Builder.Default
    private Boolean isApprovedLevel1 = false;

    @Column(name = "is_approved_level2", nullable = false)
    @Builder.Default
    private Boolean isApprovedLevel2 = false;

    @Column(name = "symbol_id")
    private UUID symbolId;

    @OneToMany(mappedBy = "dikeRevetment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DikeRevetmentAttachment> attachments = new ArrayList<>();

    public void setApprovedDateLevel1(LocalDate date) {
        setApprovedDateLevel1(date != null ? date.atStartOfDay() : null);
    }

    public void setApprovedDateLevel2(LocalDate date) {
        setApprovedDateLevel2(date != null ? date.atStartOfDay() : null);
    }
}
