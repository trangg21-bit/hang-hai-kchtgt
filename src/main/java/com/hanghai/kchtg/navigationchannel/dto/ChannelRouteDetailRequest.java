package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.common.entity.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Create/update payload for a channel route detail row (#22-#38) of NavigationChannel (F-038).
 * routeCode (#23) is system-generated/disabled — not accepted from the client (BR-038-03).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class ChannelRouteDetailRequest {

    private Integer sequenceNo;
    private String routeClassification;
    private String routeName;
    private Integer routeType;
    private String turningBasinLocation;
    private BigDecimal turningBasinRadiusMeters;
    private BigDecimal verticalClearanceMeters;
    private BigDecimal channelLengthKilometers;
    private BigDecimal maximumDesignWidthMeters;
    private BigDecimal minimumDesignWidthMeters;
    private BigDecimal designDepthMeters;
    private BigDecimal currentDepthMeters;
    private BigDecimal designSlope;
    private BigDecimal minimumCurveRadiusMeters;
    private BigDecimal routeLatestDredgingVolumeCubicMeters;
    private Integer routeLatestMaintenanceYear;
    private Integer routeGrade;
}
