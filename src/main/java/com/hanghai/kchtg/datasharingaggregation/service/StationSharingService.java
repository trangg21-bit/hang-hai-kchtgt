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
        req.setSharingType(SharingType.COASTAL_RADIO_STATION);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("COASTAL_RADIO_STATION");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiInmarsat(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.INMARSAT_STATION);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("INMARSAT_STATION");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiCospasSarsat(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.COSPAS_SARSAT_STATION);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("COSPAS_SARSAT_STATION");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDaiLRIT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.LRIT_STATION);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("LRIT_STATION");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareMaritimeStationHN(String dataPayload) {
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
