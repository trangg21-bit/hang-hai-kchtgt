package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.dto.*;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StationSharingService {

    private final DataSharingAggregationService mainService;

    public StationSharingService(DataSharingAggregationService mainService) {
        this.mainService = mainService;
    }

    public DataSharingAggregationResponse shareDaiTTDH(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.DAI_TTDH);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DAI_TTDH");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiInmarsat(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.DAI_INMARSAT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DAI_INMARSAT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiCospasSarsat(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.DAI_COSPAS_SARSAT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DAI_COSPAS_SARSAT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiLRIT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.DAI_LRIT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DAI_LRIT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiHangHaiHN(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.DAI_HANG_HAI_HN);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DAI_HANG_HAI_HN");
        return mainService.create(req);
    }

    public List<DataSharingAggregationResponse> getStationSharingRecords(SharingStatus status) {
        DataSharingAggregationFilter filter = new DataSharingAggregationFilter();
        filter.setStatus(status);
        return mainService.filter(filter);
    }
}
