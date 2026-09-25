package com.hanghai.kchtg.navigationchannel.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;

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
    @Size(max = 255, message = "Tên tuyến luồng tối đa 255 ký tự")
    private String routeName;
    private Integer routeType;
    @Size(max = 2000, message = "Vị trí vũng quay tàu tối đa 2000 ký tự")
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
    private BigDecimal protectionScope;
    private String memo;

    @com.fasterxml.jackson.annotation.JsonProperty("protectionScopeMeters")
    public void setProtectionScopeMeters(BigDecimal val) {
        if (this.protectionScope == null) {
            this.protectionScope = val;
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("notes")
    public void setNotes(String val) {
        if (this.memo == null) {
            this.memo = val;
        }
    }
}
