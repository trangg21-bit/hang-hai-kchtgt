package com.hanghai.kchtg.businessintegration.controller;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.service.CargoStatisticsIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cargo-statistics-integrations")
public class CargoStatisticsIntegrationController {

    @Autowired
    private CargoStatisticsIntegrationService cargoService;

    @PostMapping("/cargo-passenger-volume")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateCargoPassengerVolume(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(cargoService.integrateCargoPassengerVolume(request));
    }

    @PostMapping("/cargo-vn-ship")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateCargoVNShip(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(cargoService.integrateCargoVNShip(request));
    }

    @PostMapping("/cargo-managed-area")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateCargoManagedArea(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(cargoService.integrateCargoManagedArea(request));
    }

    @PostMapping("/monthly-cargo")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateMonthlyCargo(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(cargoService.integrateMonthlyCargo(request));
    }

    @PostMapping("/annual-cargo")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateAnnualCargo(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(cargoService.integrateAnnualCargo(request));
    }

    @PostMapping("/transport-service-output")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateTransportServiceOutput(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(cargoService.integrateTransportServiceOutput(request));
    }
}
