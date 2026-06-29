package com.hanghai.kchtg.luonghanghai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiCreateRequest {

    @NotBlank(message = "Loai tau la bat buoc")
    @jakarta.validation.constraints.Size(max = 100)
    private String loaiTau;

    @NotNull(message = "So luong la bat buoc")
    @Positive(message = "So luong phai la so duong")
    private Integer soLuong;

    @NotNull(message = "Ngay ghi nhan la bat buoc")
    private LocalDate ngayGhiNhan;

    @jakarta.validation.constraints.Size(max = 50)
    private String gioDien;

    private BigDecimal taiTrong;

    private BigDecimal dienTichDangBo;

    @jakarta.validation.constraints.Size(max = 500)
    private String ghiChu;

    @NotBlank(message = "Nguoi tao la bat buoc")
    private String createdBy;
}
