package com.hanghai.kchtg.tai.dto.lrit;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO cho việc cập nhật đài LRIT (F-096).
 * NOTE: code KHÔNG được phép sửa đổi. UUID-based identification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaiLRITRequest {

    @Size(max = 200)
    private String name;

    @DecimalMin("-90")
    @DecimalMax("90")
    private BigDecimal latitude;

    @DecimalMin("-180")
    @DecimalMax("180")
    private BigDecimal longitude;

    @Positive(message = "Tầm hoạt động phải lớn hơn 0")
    private Integer range;

    private UUID id;
}
