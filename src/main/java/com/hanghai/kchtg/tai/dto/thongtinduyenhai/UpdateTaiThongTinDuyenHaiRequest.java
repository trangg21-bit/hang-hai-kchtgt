package com.hanghai.kchtg.tai.dto.thongtinduyenhai;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO cho việc cập nhật đài thông tin duyên hải (F-087).
 * NOTE: code KHÔNG được phép sửa đổi. UUID-based identification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaiThongTinDuyenHaiRequest {

    @Size(max = 200)
    private String name;

    @DecimalMin("0")
    @DecimalMax("99999.999")
    private BigDecimal frequency;

    @Positive(message = "Tầm hoạt động phải lớn hơn 0")
    private Integer range;

    @Size(max = 100)
    private String country;

    @Size(max = 200)
    private String contactInfo;

    private UUID id;
}
