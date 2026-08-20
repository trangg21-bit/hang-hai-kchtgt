package com.hanghai.kchtg.station.dto.buoy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tóm tắt một phao tiêu thuộc nhà trạm (CSV 34-38 — section Danh sách phao tiêu, read-only).
 * Body của GET /v1/buoy-station/{id}/buoys.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationBuoySummary {
    private String id;
    private String code;
    private String name;
    private String classification;
    private String classificationBuoy;
    private String classificationMark;
}
