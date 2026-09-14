package com.hanghai.kchtg.port.dto.berth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectRequest {
    @NotBlank
    private String cap;

    @NotBlank
    @Size(min = 10, message = "Lý do từ chối phải có ít nhất 10 ký tự")
    private String lyDo;
}
