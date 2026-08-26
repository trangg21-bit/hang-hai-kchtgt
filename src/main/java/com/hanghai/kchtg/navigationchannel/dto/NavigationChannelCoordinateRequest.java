package com.hanghai.kchtg.navigationchannel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;

/**
 * Create/update payload for a coordinate row (#45 — Kinh độ/Vĩ độ) of NavigationChannel (F-038).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class NavigationChannelCoordinateRequest {

    private Integer sequenceNo;
    private BigDecimal longitude;
    private BigDecimal latitude;
}
