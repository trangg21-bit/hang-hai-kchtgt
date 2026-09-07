package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Dự báo hàng hóa row payload (F-132 child port_planning_cargo_forecast,
 * matrix rows 18-24). Total band is auto-computed server-side (BR-132-03).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PortPlanningCargoForecastRequest {

    private UUID id;

    private String classification;
    private UUID portId;
    private String portName;

    private BigDecimal containerMin;
    private BigDecimal containerMax;
    private BigDecimal bulkMin;
    private BigDecimal bulkMax;
    private BigDecimal liquidMin;
    private BigDecimal liquidMax;
    private BigDecimal totalMin;
    private BigDecimal totalMax;
    private String note;
}
