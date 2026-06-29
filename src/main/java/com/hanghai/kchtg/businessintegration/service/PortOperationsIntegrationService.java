package com.hanghai.kchtg.businessintegration.service;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PortOperationsIntegrationService {

    @Autowired
    private BusinessIntegrationService integrationService;

    public BusinessDataIntegrationResponse integrateShipMovements(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.LUOT_TAU_THUYEN_VAO_ROI_CANG);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateCrewPilot(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.THUYEN_VIEN_HOA_TIEU);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateShipbuildingRepair(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.CO_SO_DONG_MOI_SUA_CHUA);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integratePortThroughputCapacity(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.NANG_LUC_THONG_QUA_BEN_CANG);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateCangThroughputCapacity(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.NANG_LUC_THONG_QUA_CANG);
        return integrationService.createIntegration(request);
    }
}
