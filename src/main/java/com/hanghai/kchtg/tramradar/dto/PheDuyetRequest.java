package com.hanghai.kchtg.tramradar.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PheDuyetRequest {
    @NotBlank(message = "Quyết định phê duyệt không được để trống")
    private String quyetDinh;

    private String lyDo;
}
