package com.hanghai.kchtg.station.dto.inmarsat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

/**
 * Option DTO siêu nhẹ phục vụ dropdown options cho các phân hệ khác liên kết tới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationInmarsatOptionResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID orgUnitId;
    private String conditionStatus;
}
