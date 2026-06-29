package com.hanghai.kchtg.businessintegration.service;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VesselIntegrationService {

    @Autowired
    private BusinessIntegrationService integrationService;

    public BusinessDataIntegrationResponse integrateShipArrivalDeparture(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TAU_BIEN_RA_VAO_CANG);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateInlandWaterVessel(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.PHUONG_TIEN_THUY_NOI_DIA);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateForeignShip(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TAU_BIEN_NUOC_NGOAI);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateVNInternationalShip(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TAU_BIEN_VN_QUOC_TE);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateVNNationalityShip(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TAU_BIEN_CO_QUOC_TICH_VN);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateTug(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TAU_THUYEN_LAI_DAT);
        return integrationService.createIntegration(request);
    }
}
