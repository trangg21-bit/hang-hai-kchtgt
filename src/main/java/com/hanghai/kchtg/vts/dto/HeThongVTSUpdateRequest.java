package com.hanghai.kchtg.vts.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeThongVTSUpdateRequest {
    private String tenHeThong;
    private String viTri;
    private String tinhTrang;
    private String mucDoPhuTrach;
    private String nguonGoc;
    private String doiTac;
}
