package com.hanghai.kchtg.datasharingaggregation.service;

import com.hanghai.kchtg.datasharingaggregation.dto.*;
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

    public DataSharingAggregationResponse shareCangCan(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.CANG_CAN);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("CANG_CAN");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTrangThaiHoatDongKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TRANG_THAI_HOAT_DONG_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TRANG_THAI_HOAT_DONG_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareThongTinTaiSanKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.THONG_TIN_TAI_SAN_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("THONG_TIN_TAI_SAN_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareThongTinTongHopKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.THONG_TIN_TONG_HOP_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("THONG_TIN_TONG_HOP_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareThongTinBaoTriKCHTGT(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.THONG_TIN_BAO_TRI_KCHTGT);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("THONG_TIN_BAO_TRI_KCHTGT");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTongHopKCHTGT_CangBien(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_CANG_BIEN);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_CANG_BIEN");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTongHopKCHTGT_BenCangCauCang(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_BEN_CANG_CAU_CANG);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_BEN_CANG_CAU_CANG");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTongHopKCHTGT_LuongHangHai(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_LUONG_HANG_HAI);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_LUONG_HANG_HAI");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTongHopKCHTGT_KhuChuyenTaiNeuDau(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_KHU_CHUYEN_TAI_NEU_DAU);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_KHU_CHUYEN_TAI_NEU_DAU");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTongHopKCHTGT_PhaoTieu(String dataPayload) {
        CreateDataSharingAggregationRequest req = new CreateDataSharingAggregationRequest();
        req.setSharingType(SharingType.TONG_HOP_KCHTGT_PHAO_TIEU);
        req.setDataPayload(dataPayload);
        req.setTargetSystem("TONG_HOP_KCHTGT_PHAO_TIEU");
        return mainService.create(req);
    }

    public DataSharingAggregationResponse shareTongHopKCHTGT_HeThongDenBien(String dataPayload) {
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
