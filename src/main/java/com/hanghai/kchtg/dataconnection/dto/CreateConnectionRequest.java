package com.hanghai.kchtg.dataconnection.dto;

import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.enums.SyncFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for creating a new {@code DataConnection}.
 */
@Data
public class CreateConnectionRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 255)
    private String targetSystem;

    @NotNull
    private ConnectionType connectionType;

    @Size(max = 1024)
    private String endpointUrl;

    @NotNull
    private AuthType authType;

    /** Raw credentials (will be encrypted before persistence). */
    private String credentials;

    @NotNull
    private SyncFrequency syncFrequency;
}