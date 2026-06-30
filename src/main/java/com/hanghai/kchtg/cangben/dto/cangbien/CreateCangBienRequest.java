package com.hanghai.kchtg.cangben.dto.cangbien;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request DTO for creating a new CangBien (port).
 * GPS fields (viDo/kinhDo) must be both present or both absent.
 */
@Data
public class CreateCangBienRequest {

    @NotBlank(message = "Mã cảng không được để trống")
    @Size(max = 50, message = "Mã cảng tối đa 50 ký tự")
    private String maCang;

    @NotBlank(message = "Tên cảng không được để trống")
    @Size(max = 255, message = "Tên cảng tối đa 255 ký tự")
    private String tenCang;

    @Size(max = 100, message = "Tỉnh/thành phố tối đa 100 ký tự")
    private String tinhThanhPho;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal viDo;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal kinhDo;

    @DecimalMin(value = "0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal dienTich;

    private BigDecimal khaNangTiepNhan;

    private String trangThaiHoatDong;

    /**
     * GPS paired-field constraint: viDo and kinhDo must both be present or both be absent.
     */
    @AssertTrue(message = "Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau")
    public boolean isGpsPaired() {
        return (viDo == null) == (kinhDo == null);
    }
}
