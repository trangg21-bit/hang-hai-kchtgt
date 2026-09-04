package com.hanghai.kchtg.vtsoperationcenter.entity;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vts_operation_center")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class VtsOperationCenter extends BaseApprovableEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "vts_system_id")
    private UUID vtsSystemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vts_system_id", insertable = false, updatable = false)
    private VtsSystem vtsSystem;

    @Column(name = "port_id")
    private UUID portId;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "coverage", columnDefinition = "TEXT")
    private String coverage;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

    @Column(name = "note", length = 2000)
    private String note;

    // Trường #13 của ma trận dữ liệu (F-293): hệ quy chiếu tọa độ.
    @Column(name = "coordinate_reference_system", length = 50)
    private String coordinateReferenceSystem;

    @Column(name = "symbol_id")
    private UUID symbolId;

    // Các trường phân quyền (org_unit_id, province_id, security_level), GIS (spatial_id) và
    // toàn bộ vết phê duyệt 2 cấp — kể cả submitted_at/submitted_by và
    // level1/level2_approval_content — đã nằm ở BaseApprovableEntity, không khai lại ở đây.

    // Mặc định approvalStatus = DRAFT do BaseApprovableEntity.onBaseApprovablePrePersist() lo,
    // không khai @PrePersist trùng ở đây (trường ở lớp cha là private).
}
