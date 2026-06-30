package com.hanghai.kchtg.cosuachua.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSuaChuaDongTauUpdateRequest {

    @Size(max = 255)
    private String tenCoSo;

    @Size(max = 500)
    private String diaChi;

    @Size(max = 100)
    private String tinhThanh;

    @Size(max = 20)
    private String soDienThoai;

    @Size(max = 100)
    private String email;

    @Size(max = 100)
    private String loaiCoSo;

    @Size(max = 255)
    private String khaNang;

    @Size(max = 255)
    private String chuQuan;
}
