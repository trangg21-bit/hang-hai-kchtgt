package com.hanghai.kchtg.cosuachua.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSuaChuaDongTauCreateRequest {

    @NotBlank(message = "tenCoSo is required")
    @Size(max = 255)
    private String tenCoSo;

    @NotBlank(message = "diaChi is required")
    @Size(max = 500)
    private String diaChi;

    @NotBlank(message = "tinhThanh is required")
    @Size(max = 100)
    private String tinhThanh;

    @Size(max = 20)
    private String soDienThoai;

    @Size(max = 100)
    private String email;

    @NotBlank(message = "loaiCoSo is required")
    @Size(max = 100)
    private String loaiCoSo;

    @Size(max = 255)
    private String khaNang;

    @Size(max = 255)
    private String chuQuan;
}
