package com.hanghai.kchtg.interconnect.dto;

import com.hanghai.kchtg.interconnect.enums.ConnectionStatus;
import jakarta.validation.constraints.Size;

public class UpdateConnectionRequest {

    @Size(max = 255, message = "Tên kết nối không được vượt quá 255 ký tự")
    private String connectionName;

    private String password;

    private ConnectionStatus status;

    public String getConnectionName() {
        return connectionName;
    }

    public void setConnectionName(String connectionName) {
        this.connectionName = connectionName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public ConnectionStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectionStatus status) {
        this.status = status;
    }
}
