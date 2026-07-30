package com.hanghai.kchtg.navigationchannel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChannelRouteDetailResponse {
    private UUID id;
    private Integer sequenceNo;
    private String classification;
    private String code;
    private String name;
    private Integer channelRouteType;
    private String currentDepth;
    private String designSlope;
    private BigDecimal length;
    private BigDecimal maxWidth;
    private BigDecimal minWidth;
    private BigDecimal depth;
    private BigDecimal dredgingVolume;
    private Boolean publicAccess;
    private Boolean dedicated;
    private String clearanceHeight;
    private String turningBasinLocation;
    private java.math.BigDecimal turningBasinRadius;
    private java.math.BigDecimal minCurveRadius;
    private String channelProtectionScope;
}
