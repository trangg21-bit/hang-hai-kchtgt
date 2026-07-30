package com.hanghai.kchtg.businessintegration.controller;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.service.PortOperationsIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/port-operations-integrations")
public class PortOperationsIntegrationController {

    @Autowired
    private PortOperationsIntegrationService portService;

    @PostMapping("/ship-movements")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateShipMovements(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(portService.integrateShipMovements(request));
    }

    @PostMapping("/crew-pilot")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateCrewPilot(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(portService.integrateCrewPilot(request));
    }

    @PostMapping("/shipbuilding-repair")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateShipbuildingRepair(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(portService.integrateShipbuildingRepair(request));
    }

    @PostMapping("/berth-throughput")
    public ResponseEntity<BusinessDataIntegrationResponse> integrateBerthThroughputCapacity(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(portService.integrateBerthThroughputCapacity(request));
    }

    @PostMapping("/port-throughput")
    public ResponseEntity<BusinessDataIntegrationResponse> integratePortThroughputCapacity(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(portService.integratePortThroughputCapacity(request));
    }
}
