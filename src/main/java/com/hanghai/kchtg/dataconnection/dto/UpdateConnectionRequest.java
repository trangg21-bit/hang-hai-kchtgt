package com.hanghai.kchtg.dataconnection.dto;

import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.enums.SyncFrequency;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for partially updating an existing {@code DataConnection}.
 * All fields are optional - only supplied fields are applied.
 */
@Data
public class UpdateConnectionRequest {

    @Size(max = 255)
    private String name;

    @Size(max = 50)
    private String code;

    @Size(max = 255)
    private String targetSystem;

    private ConnectionType connectionType;

    @Size(max = 1024)
    private String endpointUrl;

    private AuthType authType;

    /** Raw credentials (will be encrypted before persistence). */
    private String credentials;

    private SyncFrequency syncFrequency;

    private ConnectionStatus status;
}