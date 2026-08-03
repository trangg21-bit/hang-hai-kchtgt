package com.hanghai.kchtg.businessintegration.dto;

import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class BusinessDataIntegrationRequest implements Serializable {
    private String id;
    @NotBlank
    private IntegrationType integrationType;
    private String sourceSystem;
    private String integrationPeriod;
    private String dataPayload;
    private boolean autoRetry;

    public BusinessDataIntegrationRequest(IntegrationType type, String payload) {
        this.integrationType = type;
        this.dataPayload = payload;
    }
}
