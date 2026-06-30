package com.hanghai.kchtg.vts.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeThongVTSCreateRequest {
    @NotBlank(message = "Tên hệ thống không được để trống")
    private String tenHeThong;

    @NotBlank(message = "Vị trí không được để trống")
    private String viTri;

    private String tinhTrang;
    private String mucDoPhuTrach;
    private String nguonGoc;
    private String doiTac;
}
