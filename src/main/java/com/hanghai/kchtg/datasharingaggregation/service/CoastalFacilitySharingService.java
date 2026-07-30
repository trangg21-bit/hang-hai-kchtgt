package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.dto.CreateDataSharingAggregationRequest;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationFilter;
import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CoastalFacilitySharingService {

    private final DataSharingAggregationService mainService;

    public CoastalFacilitySharingService(DataSharingAggregationService mainService) {
        this.mainService = mainService;
    }

    public DataSharingAggregationResponse shareDeChanSongDeChanCat(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.DE_CHAN_SONG_DE_CHAN_CAT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DE_CHAN_SONG_DE_CHAN_CAT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareNavigationChannel(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.NAVIGATION_CHANNEL);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("NAVIGATION_CHANNEL");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareDikeRevetment(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_DIKE_REVETMENT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("DIKE_REVETMENT");
        return mainService.create(req);
    }

    public List<DataSharingAggregationResponse> getCoastalFacilities(SharingStatus status) {
        DataSharingAggregationFilter filter = new DataSharingAggregationFilter();
        filter.setTargetSystem("DE_CHAN_SONG_DE_CHAN_CAT");
        filter.setStatus(status);
        return mainService.filter(filter);
    }
}
