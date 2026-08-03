package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.dto.CreateDataSharingAggregationRequest;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationFilter;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PortAndAssetSharingService {

    private final DataSharingAggregationService mainService;

    public PortAndAssetSharingService(DataSharingAggregationService mainService) {
        this.mainService = mainService;
    }

    public DataSharingAggregationResponse shareDryPort(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.CANG_CAN);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("CANG_CAN");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareOperationalStatusKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TRANG_THAI_HOAT_DONG_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TRANG_THAI_HOAT_DONG_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAssetInfoKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.THONG_TIN_TAI_SAN_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("THONG_TIN_TAI_SAN_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedInfoKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.THONG_TIN_TONG_HOP_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("THONG_TIN_TONG_HOP_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareMaintenanceInfoKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.THONG_TIN_BAO_TRI_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("THONG_TIN_BAO_TRI_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedPort(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_CANG_BIEN);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_CANG_BIEN");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedBerthAndPier(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_BEN_CANG_CAU_CANG);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_BEN_CANG_CAU_CANG");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedNavigationChannel(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_NAVIGATION_CHANNEL);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_NAVIGATION_CHANNEL");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedTransshipmentAndAnchorage(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_KHU_CHUYEN_TAI_NEU_DAU);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_KHU_CHUYEN_TAI_NEU_DAU");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedBuoy(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_PHAO_TIEU);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_PHAO_TIEU");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareAggregatedBeaconSystem(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_HE_THONG_DEN_BIEN);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_HE_THONG_DEN_BIEN");
        return mainService.create(req);
    }

    public List<DataSharingAggregationResponse> getPortAndAssetRecords(SharingStatus status) {
        DataSharingAggregationFilter filter = new DataSharingAggregationFilter();
        filter.setStatus(status);
        return mainService.filter(filter);
    }
}
