package com.hanghai.kchtg.navigationchannel.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Tuyến luồng con (#22-#38) của Luồng hàng hải (F-038).
 * Extends {@link BaseEntity} (audit + soft delete); audit handled by AuditingEntityListener.
 */
@Entity
@Table(name = "channel_route_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class ChannelRouteDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "navigation_channel_id", nullable = false)
    private NavigationChannel navigationChannel;

    @Column(name = "sequence_no")
    private Integer sequenceNo;

    @Column(name = "route_classification", length = 5)
    private String routeClassification;

    @Column(name = "route_code", length = 50)
    private String routeCode;

    @Column(name = "route_name", length = 500)
    private String routeName;

    @Column(name = "route_type")
    private Integer routeType;

    @Column(name = "turning_basin_location", length = 500)
    private String turningBasinLocation;

    @Column(name = "turning_basin_radius_meters")
    private BigDecimal turningBasinRadiusMeters;

    @Column(name = "vertical_clearance_meters")
    private BigDecimal verticalClearanceMeters;

    @Column(name = "channel_length_kilometers")
    private BigDecimal channelLengthKilometers;

    @Column(name = "maximum_design_width_meters")
    private BigDecimal maximumDesignWidthMeters;

    @Column(name = "minimum_design_width_meters")
    private BigDecimal minimumDesignWidthMeters;

    @Column(name = "design_depth_meters")
    private BigDecimal designDepthMeters;

    @Column(name = "current_depth_meters")
    private BigDecimal currentDepthMeters;

    @Column(name = "design_slope")
    private BigDecimal designSlope;

    @Column(name = "minimum_curve_radius_meters")
    private BigDecimal minimumCurveRadiusMeters;

    @Column(name = "route_latest_dredging_volume_cubic_meters")
    private BigDecimal routeLatestDredgingVolumeCubicMeters;

    @Column(name = "route_latest_maintenance_year")
    private Integer routeLatestMaintenanceYear;

    @Column(name = "route_grade")
    private Integer routeGrade;
}
