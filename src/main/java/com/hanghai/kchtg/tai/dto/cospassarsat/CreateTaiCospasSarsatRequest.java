package com.hanghai.kchtg.tai.dto.cospassarsat;

import com.hanghai.kchtg.tai.entity.TaiType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO cho việc tạo mới đài Cospas-Sarsat (F-092).
 * Bao gồm validation cho các trường theo yêu cầu nghiệp vụ.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaiCospasSarsatRequest {

    @NotBlank(message = "Mã đài không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên đài không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đài không được để trống")
    private TaiType type;

    @NotNull(message = "Tần số không được để trống")
    @DecimalMin("0")
    @DecimalMax("99999.999")
    private BigDecimal frequency;

    @Size(max = 50)
    private String protocol;

    @Size(max = 100)
    private String country;
}
