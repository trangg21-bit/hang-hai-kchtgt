package com.hanghai.kchtg.tai.dto.cospassarsat;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO cho việc cập nhật đài Cospas-Sarsat (F-093).
 * NOTE: code KHÔNG được phép sửa đổi. UUID-based identification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaiCospasSarsatRequest {

    @Size(max = 200)
    private String name;

    @DecimalMin("0")
    @DecimalMax("99999.999")
    private BigDecimal frequency;

    @Size(max = 50)
    private String protocol;

    @Size(max = 100)
    private String country;

    private UUID id;
}
