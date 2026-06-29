package com.hanghai.kchtg.businessintegration.controller;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.service.VesselIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vessel-integrations")
public class VesselIntegrationController {

    @Autowired
    private VesselIntegrationService vesselService;

    @PostMapping("/ship-arrival-departure")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateShipArrivalDeparture(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(vesselService.integrateShipArrivalDeparture(request));
    }

    @PostMapping("/inland-water-vessel")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateInlandWaterVessel(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(vesselService.integrateInlandWaterVessel(request));
    }

    @PostMapping("/foreign-ship")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateForeignShip(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(vesselService.integrateForeignShip(request));
    }

    @PostMapping("/vn-international-ship")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateVNInternationalShip(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(vesselService.integrateVNInternationalShip(request));
    }

    @PostMapping("/vn-nationality-ship")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateVNNationalityShip(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(vesselService.integrateVNNationalityShip(request));
    }

    @PostMapping("/tug")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateTug(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(vesselService.integrateTug(request));
    }
}
