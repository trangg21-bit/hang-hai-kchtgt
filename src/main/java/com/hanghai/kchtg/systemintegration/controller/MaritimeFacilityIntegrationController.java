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

    @PostMapping("/berth")
    public ResponseEntity<SystemIntegrationResponse> integrateBerth(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateBerth(request));
    }

    @PostMapping("/pier")
    public ResponseEntity<SystemIntegrationResponse> integratePier(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integratePier(request));
    }

    @PostMapping("/buoy-berth")
    public ResponseEntity<SystemIntegrationResponse> integrateBuoyBerth(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateBuoyBerth(request));
    }

    @PostMapping("/siltation-area")
    public ResponseEntity<SystemIntegrationResponse> integrateSiltationArea(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateSiltationArea(request));
    }

    @PostMapping("/transshipment-area")
    public ResponseEntity<SystemIntegrationResponse> integrateTransshipmentArea(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateTransshipmentArea(request));
    }

    @PostMapping("/anchorage-area")
    public ResponseEntity<SystemIntegrationResponse> integrateAnchorageArea(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateAnchorageArea(request));
    }

    @PostMapping("/ship-repair-facility")
    public ResponseEntity<SystemIntegrationResponse> integrateShipRepairFacility(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateShipRepairFacility(request));
    }

    @PostMapping("/dike-revetment")
    public ResponseEntity<SystemIntegrationResponse> integrateDikeRevetment(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateDikeRevetment(request));
    }

    @PostMapping("/navigation-channel")
    public ResponseEntity<SystemIntegrationResponse> integrateNavigationChannel(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateNavigationChannel(request));
    }

    @PostMapping("/dry-port")
    public ResponseEntity<SystemIntegrationResponse> integrateDryPort(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(facilityService.integrateDryPort(request));
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
