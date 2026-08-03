package com.hanghai.kchtg.systemintegration.dto;

import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SystemIntegrationRequest implements Serializable {
    private String id;
    @NotBlank
    private IntegrationType integrationType;
    @NotBlank
    private String sourceSystem;
    @NotBlank
    private String targetSystem;
    private String dataPayload;
    private boolean autoRetry;

    public SystemIntegrationRequest(IntegrationType integrationType, String sourceSystem, String targetSystem, String dataPayload) {
        this.integrationType = integrationType;
        this.sourceSystem = sourceSystem;
        this.targetSystem = targetSystem;
        this.dataPayload = dataPayload;
        this.autoRetry = false;
    }
}
