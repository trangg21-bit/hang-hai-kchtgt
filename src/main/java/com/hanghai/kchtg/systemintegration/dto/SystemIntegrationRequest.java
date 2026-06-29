package com.hanghai.kchtg.systemintegration.dto;

import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;

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

    public SystemIntegrationRequest() {}

    public SystemIntegrationRequest(IntegrationType integrationType, String sourceSystem, String targetSystem, String dataPayload) {
        this.integrationType = integrationType;
        this.sourceSystem = sourceSystem;
        this.targetSystem = targetSystem;
        this.dataPayload = dataPayload;
        this.autoRetry = false;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public IntegrationType getIntegrationType() { return integrationType; }
    public void setIntegrationType(IntegrationType integrationType) { this.integrationType = integrationType; }
    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }
    public String getTargetSystem() { return targetSystem; }
    public void setTargetSystem(String targetSystem) { this.targetSystem = targetSystem; }
    public String getDataPayload() { return dataPayload; }
    public void setDataPayload(String dataPayload) { this.dataPayload = dataPayload; }
    public boolean isAutoRetry() { return autoRetry; }
    public void setAutoRetry(boolean autoRetry) { this.autoRetry = autoRetry; }
}
