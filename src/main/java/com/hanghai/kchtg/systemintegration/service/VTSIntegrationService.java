package com.hanghai.kchtg.systemintegration.service;

import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VTSIntegrationService {

    @Autowired
    private SystemIntegrationService integrationService;

    public SystemIntegrationResponse integrateVTSData(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_VTS);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateVTSOperationInfo(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DIEU_HANH_VTS);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateRadarData(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TRAM_RADAR);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateAISData(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_AIS);
        return integrationService.createIntegration(request);
    }
}
