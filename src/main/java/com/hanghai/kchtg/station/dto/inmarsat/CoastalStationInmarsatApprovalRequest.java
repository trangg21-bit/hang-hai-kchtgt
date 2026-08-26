package com.hanghai.kchtg.station.dto.inmarsat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

/**
 * DTO phê duyệt / từ chối Đài thông tin vệ tinh Inmarsat (F-101).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationInmarsatApprovalRequest {

    private String stationId;
    private Boolean approved;
    private String rejectionReason;
    private String note;
}
