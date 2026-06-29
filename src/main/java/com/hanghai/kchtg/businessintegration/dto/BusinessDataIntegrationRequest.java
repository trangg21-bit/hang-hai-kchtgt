package com.hanghai.kchtg.businessintegration.dto;

import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;

public class BusinessDataIntegrationRequest implements Serializable {
    private String id;
    @NotBlank
    private IntegrationType integrationType;
    private String sourceSystem;
    private String integrationPeriod;
    private String dataPayload;
    private boolean autoRetry;

    public BusinessDataIntegrationRequest() {}

    public BusinessDataIntegrationRequest(IntegrationType type, String payload) {
        this.integrationType = type;
        this.dataPayload = payload;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public IntegrationType getIntegrationType() { return integrationType; }
    public void setIntegrationType(IntegrationType integrationType) { this.integrationType = integrationType; }
    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }
    public String getIntegrationPeriod() { return integrationPeriod; }
    public void setIntegrationPeriod(String integrationPeriod) { this.integrationPeriod = integrationPeriod; }
    public String getDataPayload() { return dataPayload; }
    public void setDataPayload(String dataPayload) { this.dataPayload = dataPayload; }
    public boolean isAutoRetry() { return autoRetry; }
    public void setAutoRetry(boolean autoRetry) { this.autoRetry = autoRetry; }
}
