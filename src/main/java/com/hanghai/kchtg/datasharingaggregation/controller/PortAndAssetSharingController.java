package com.hanghai.kchtg.datasharingaggregation.controller;

import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.service.PortAndAssetSharingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sharing-aggregation/port-assets")
public class PortAndAssetSharingController {
    private final PortAndAssetSharingService service;

    public PortAndAssetSharingController(PortAndAssetSharingService service) {
        this.service = service;
    }

    @PostMapping("/cang-can")
    public ResponseEntity<DataSharingAggregationResponse> shareCangCan(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareCangCan(dataPayload));
    }

    @PostMapping("/trang-thai-hoat-dong")
    public ResponseEntity<DataSharingAggregationResponse> shareTrangThaiHoatDongKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTrangThaiHoatDongKCHTGT(dataPayload));
    }

    @PostMapping("/thong-tin-tai-san")
    public ResponseEntity<DataSharingAggregationResponse> shareThongTinTaiSanKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareThongTinTaiSanKCHTGT(dataPayload));
    }

    @PostMapping("/thong-tin-tong-hop")
    public ResponseEntity<DataSharingAggregationResponse> shareThongTinTongHopKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareThongTinTongHopKCHTGT(dataPayload));
    }

    @PostMapping("/thong-tin-bao-tri")
    public ResponseEntity<DataSharingAggregationResponse> shareThongTinBaoTriKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareThongTinBaoTriKCHTGT(dataPayload));
    }

    @PostMapping("/tong-hop-cang-bien")
    public ResponseEntity<DataSharingAggregationResponse> shareTongHopKCHTGT_CangBien(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTongHopKCHTGT_CangBien(dataPayload));
    }

    @PostMapping("/tong-hop-ben-cang")
    public ResponseEntity<DataSharingAggregationResponse> shareTongHopKCHTGT_BenCangCauCang(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTongHopKCHTGT_BenCangCauCang(dataPayload));
    }

    @PostMapping("/tong-hop-luong-hang-hai")
    public ResponseEntity<DataSharingAggregationResponse> shareTongHopKCHTGT_LuongHangHai(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTongHopKCHTGT_LuongHangHai(dataPayload));
    }

    @PostMapping("/tong-hop-khu-chuyen-tai")
    public ResponseEntity<DataSharingAggregationResponse> shareTongHopKCHTGT_KhuChuyenTaiNeuDau(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTongHopKCHTGT_KhuChuyenTaiNeuDau(dataPayload));
    }

    @PostMapping("/tong-hop-phao-tieu")
    public ResponseEntity<DataSharingAggregationResponse> shareTongHopKCHTGT_PhaoTieu(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTongHopKCHTGT_PhaoTieu(dataPayload));
    }

    @PostMapping("/tong-hop-den-bien")
    public ResponseEntity<DataSharingAggregationResponse> shareTongHopKCHTGT_HeThongDenBien(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareTongHopKCHTGT_HeThongDenBien(dataPayload));
    }

    @GetMapping
    public ResponseEntity<List<DataSharingAggregationResponse>> getRecords(
            @RequestParam(required = false) SharingStatus status) {
        if (status != null) {
            return ResponseEntity.ok(service.getPortAndAssetRecords(status));
        }
        return ResponseEntity.ok(service.getPortAndAssetRecords(null));
    }
}
