package com.hanghai.kchtg.port.dto.stormshelter;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequest {

    @NotBlank(message = "Cấp phê duyệt không được để trống")
    private String cap;

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String lyDo;
}
