package com.hanghai.kchtg.tai.dto.inmarsat;

import com.hanghai.kchtg.tai.entity.TaiType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO cho việc tạo mới đài Inmarsat (F-089).
 * Bao gồm validation cho các trường theo yêu cầu nghiệp vụ.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaiInmarsatRequest {

    @NotBlank(message = "Mã đài không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên đài không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đài không được để trống")
    private TaiType type;

    @Size(max = 100)
    private String satelliteId;

    @DecimalMin("0")
    @DecimalMax("100")
    private BigDecimal signalStrength;

    @Size(max = 100)
    private String serviceType;
}
