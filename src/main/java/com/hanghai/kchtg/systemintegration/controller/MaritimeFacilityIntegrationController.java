package com.hanghai.kchtg.systemintegration.controller;

import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.service.MaritimeFacilityIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/facility-integrations")
public class MaritimeFacilityIntegrationController {

    @Autowired
    private MaritimeFacilityIntegrationService facilityService;

    @PostMapping("/ben-cang")
    public ResponseEntity<SystemIntegrationResponse> integrateBenCang(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateBenCang(request));
    }

    @PostMapping("/cau-cang")
    public ResponseEntity<SystemIntegrationResponse> integrateCauCang(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateCauCang(request));
    }

    @PostMapping("/ben-phao")
    public ResponseEntity<SystemIntegrationResponse> integrateBenPhao(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateBenPhao(request));
    }

    @PostMapping("/khu-tram-tich-boi")
    public ResponseEntity<SystemIntegrationResponse> integrateKhuTramTichBoi(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateKhuTramTichBoi(request));
    }

    @PostMapping("/khu-chuyen-tai")
    public ResponseEntity<SystemIntegrationResponse> integrateKhuChuyenTai(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateKhuChuyenTai(request));
    }

    @PostMapping("/khu-neo-dau")
    public ResponseEntity<SystemIntegrationResponse> integrateKhuNeoDau(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateKhuNeoDau(request));
    }

    @PostMapping("/co-so-sua-chua")
    public ResponseEntity<SystemIntegrationResponse> integrateCoSoSuaChua(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateCoSoSuaChua(request));
    }

    @PostMapping("/de-ke")
    public ResponseEntity<SystemIntegrationResponse> integrateDeKe(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateDeKe(request));
    }

    @PostMapping("/luong-hang-hai")
    public ResponseEntity<SystemIntegrationResponse> integrateLuongHangHai(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateLuongHangHai(request));
    }

    @PostMapping("/cang-can")
    public ResponseEntity<SystemIntegrationResponse> integrateCangCan(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateCangCan(request));
    }

    @PostMapping("/maritime-chart")
    public ResponseEntity<SystemIntegrationResponse> integrateMaritimeChart(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateMaritimeChart(request));
    }

    @PostMapping("/light-info")
    public ResponseEntity<SystemIntegrationResponse> integrateLightInfo(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateLightInfo(request));
    }

    @PostMapping("/buoy-info")
    public ResponseEntity<SystemIntegrationResponse> integrateBuoyInfo(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateBuoyInfo(request));
    }

    @PostMapping("/scada")
    public ResponseEntity<SystemIntegrationResponse> integrateSCADA(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateSCADA(request));
    }

    @PostMapping("/cctv")
    public ResponseEntity<SystemIntegrationResponse> integrateCCTV(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateCCTV(request));
    }

    @PostMapping("/vts-assist")
    public ResponseEntity<SystemIntegrationResponse> integrateVTSAssist(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateVTSAssist(request));
    }
}
