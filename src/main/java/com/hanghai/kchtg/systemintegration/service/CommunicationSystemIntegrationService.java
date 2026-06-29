package com.hanghai.kchtg.systemintegration.service;

import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CommunicationSystemIntegrationService {

    @Autowired
    private SystemIntegrationService integrationService;

    public SystemIntegrationResponse integrateVHFInfo(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_THONG_TIN_VHF);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateTransmission(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_TRUYEN_DAN);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateInmarsat(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DAI_INMARSAT);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateCospasSarsat(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DAI_COSPAS_SARSAT);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateLRIT(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DAI_LRIT);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateMaritimeInfoHanoi(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DAI_HANG_HAI_HN);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateTTDH(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DAI_TTDH);
        return integrationService.createIntegration(request);
    }
}
