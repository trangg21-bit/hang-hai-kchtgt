package com.hanghai.kchtg.tai.dto.hanoi_hai;

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
 * Request DTO cho việc cập nhật đài TT hàng hải Hà Nội (F-099).
 * NOTE: code KHÔNG được phép sửa đổi. UUID-based identification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaiThongTinHangHaiHNRequest {

    @Size(max = 200)
    private String name;

    @DecimalMin("0")
    @DecimalMax("99999.999")
    private BigDecimal frequency;

    @Positive(message = "Tầm hoạt động phải lớn hơn 0")
    private Integer range;

    @Size(max = 200)
    private String department;

    private UUID id;
}
