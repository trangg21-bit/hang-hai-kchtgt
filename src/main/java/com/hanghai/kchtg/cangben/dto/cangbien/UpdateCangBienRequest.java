package com.hanghai.kchtg.cangben.dto.cangbien;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO for updating an existing CangBien.
 * The 'code' field is ignored (immutable after creation).
 * GPS fields (viDo/kinhDo) must be both present or both absent.
 */
@Data
public class UpdateCangBienRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenCang;

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
