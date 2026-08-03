package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.enums.ConnectionStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class UpdateConnectionRequest {

    @Size(max = 255, message = "Tên kết nối không được vượt quá 255 ký tự")
    private String connectionName;

    private String password;

    private ConnectionStatus status;

}
