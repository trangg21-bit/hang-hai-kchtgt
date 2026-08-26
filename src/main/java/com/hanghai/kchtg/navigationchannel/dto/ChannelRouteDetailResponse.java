package com.hanghai.kchtg.navigationchannel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response for a channel route detail row (#22-#38) of NavigationChannel (F-038).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class ChannelRouteDetailResponse {

    private UUID id;
    private Integer sequenceNo;
    private String routeClassification;
    private String routeCode;
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
