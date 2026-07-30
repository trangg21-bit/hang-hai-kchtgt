package com.hanghai.kchtg.systemintegration.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SystemIntegrationResponse implements Serializable {
    private String id;
    private String integrationType;
    private String sourceSystem;
    private String targetSystem;
    private String status;
    private String errorMessage;
    private LocalDateTime integrationDate;
    private int retryCount;
}
