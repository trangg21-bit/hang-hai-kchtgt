package com.hanghai.kchtg.port.dto.transferarea;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApproveRequest {

    @NotBlank(message = "Cấp phê duyệt không được để trống")
    private String cap;

    private String content;
}
