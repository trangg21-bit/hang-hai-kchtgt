package com.hanghai.kchtg.port.dto.berth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectRequest {
    @NotBlank
    private String cap;

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(min = 10, max = 2000, message = "Lý do từ chối phải từ 10 đến 2000 ký tự")
    private String lyDo;
}
