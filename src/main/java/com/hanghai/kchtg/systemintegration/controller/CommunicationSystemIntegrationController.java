package com.hanghai.kchtg.systemintegration.controller;

import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.service.CommunicationSystemIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/communication-integrations")
public class CommunicationSystemIntegrationController {

    @Autowired
    private CommunicationSystemIntegrationService communicationService;

    @PostMapping("/vhf")
    public ResponseEntity<SystemIntegrationResponse> integrateVHFInfo(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateVHFInfo(request));
    }

    @PostMapping("/transmission")
    public ResponseEntity<SystemIntegrationResponse> integrateTransmission(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateTransmission(request));
    }

    @PostMapping("/inmarsat")
    public ResponseEntity<SystemIntegrationResponse> integrateInmarsat(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateInmarsat(request));
    }

    @PostMapping("/cospas-sarsat")
    public ResponseEntity<SystemIntegrationResponse> integrateCospasSarsat(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateCospasSarsat(request));
    }

    @PostMapping("/lrit")
    public ResponseEntity<SystemIntegrationResponse> integrateLRIT(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateLRIT(request));
    }

    @PostMapping("/maritime-info-hn")
    public ResponseEntity<SystemIntegrationResponse> integrateMaritimeInfoHanoi(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateMaritimeInfoHanoi(request));
    }

    @PostMapping("/ttdh")
    public ResponseEntity<SystemIntegrationResponse> integrateTTDH(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(communicationService.integrateTTDH(request));
    }
}
