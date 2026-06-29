package com.hanghai.kchtg.businessintegration.service;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CargoStatisticsIntegrationService {

    @Autowired
    private BusinessIntegrationService integrationService;

    public BusinessDataIntegrationResponse integrateCargoPassengerVolume(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHOI_LUONG_HANG_HOA_HANH_KHACH);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateCargoVNShip(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHOI_LUONG_HANG_HOA_DOI_TAU_VN);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateCargoManagedArea(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHOI_LUONG_HANG_HOA_KHU_QUAN_LY);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateMonthlyCargo(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHOI_LUONG_HANG_HOA_THEO_THANG);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateAnnualCargo(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHOI_LUONG_HANG_HOA_THEO_NAM);
        return integrationService.createIntegration(request);
    }

    public BusinessDataIntegrationResponse integrateTransportServiceOutput(BusinessDataIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.SAN_LUONG_DICH_VU_VAN_TAI);
        return integrationService.createIntegration(request);
    }
}
