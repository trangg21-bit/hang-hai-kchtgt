package com.hanghai.kchtg.businessintegration.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class BusinessDataIntegrationResponse implements Serializable {
    private String id;
    private String integrationType;
    private String sourceSystem;
    private String integrationPeriod;
    private String status;
    private String errorMessage;
    private LocalDateTime integrationDate;
    private int retryCount;
}
