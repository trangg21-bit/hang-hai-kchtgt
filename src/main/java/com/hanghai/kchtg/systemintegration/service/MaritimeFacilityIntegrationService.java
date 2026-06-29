package com.hanghai.kchtg.systemintegration.service;

import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MaritimeFacilityIntegrationService {

    @Autowired
    private SystemIntegrationService integrationService;

    public SystemIntegrationResponse integrateBenCang(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.BEN_CANG);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateCauCang(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.CAU_CANG);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateBenPhao(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.BEN_PHAO);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateKhuTramTichBoi(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHU_TRAM_TICH_BOI);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateKhuChuyenTai(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHU_CHUYEN_TAI);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateKhuNeoDau(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.KHU_NEO_DAU);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateCoSoSuaChua(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.CO_SO_SUA_CHUA);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateDeKe(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.DE_KE);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateLuongHangHai(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.LUONG_HANG_HAI);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateCangCan(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.CANG_CAN);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateMaritimeChart(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.MANG_HAI_DO_DIEN_TU);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateLightInfo(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_DEN_BIEN);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateBuoyInfo(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.TIN_PHAO_TIEU);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateSCADA(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_SCADA);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateCCTV(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_CCTV);
        return integrationService.createIntegration(request);
    }

    public SystemIntegrationResponse integrateVTSAssist(SystemIntegrationRequest request) {
        request.setIntegrationType(IntegrationType.HE_THONG_PHU_TRO_VTS);
        return integrationService.createIntegration(request);
    }
}
