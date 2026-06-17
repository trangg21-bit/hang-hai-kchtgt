package com.hanghai.kchtg.dataconnection.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Optional overrides when testing an existing connection.
 * If a field is {@code null} the stored value is used.
 */
@Data
public class TestConnectionRequest {

    @Size(max = 1024)
    private String endpointUrl;

    /** Raw credentials override (not persisted). */
    private String credentials;
}
