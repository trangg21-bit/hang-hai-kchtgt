package com.hanghai.kchtg.tai.dto.lrit;

import com.hanghai.kchtg.tai.entity.TaiType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO cho việc tạo mới đài LRIT (F-095).
 * Bao gồm validation cho các trường theo yêu cầu nghiệp vụ.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaiLRITRequest {

    @NotBlank(message = "Mã đài không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên đài không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đài không được để trống")
    private TaiType type;

    @NotNull(message = "Vĩ độ không được để trống")
    @DecimalMin("-90")
    @DecimalMax("90")
    private BigDecimal latitude;

    @NotNull(message = "Kinh độ không được để trống")
    @DecimalMin("-180")
    @DecimalMax("180")
    private BigDecimal longitude;

    @NotNull(message = "Tầm hoạt động không được để trống")
    @Positive(message = "Tầm hoạt động phải lớn hơn 0")
    private Integer range;
}
