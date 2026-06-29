package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.dto.*;
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

    public DataSharingAggregationResponse shareLuongHangHai(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.LUONG_HANG_HAI);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("LUONG_HANG_HAI");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareHeThongDeKe(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_HE_THONG_DE_KE);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("HE_THONG_DE_KE");
        return mainService.create(req);
    }

    public List<DataSharingAggregationResponse> getCoastalFacilities(SharingStatus status) {
        DataSharingAggregationFilter filter = new DataSharingAggregationFilter();
        filter.setTargetSystem("DE_CHAN_SONG_DE_CHAN_CAT");
        filter.setStatus(status);
        return mainService.filter(filter);
    }
}
