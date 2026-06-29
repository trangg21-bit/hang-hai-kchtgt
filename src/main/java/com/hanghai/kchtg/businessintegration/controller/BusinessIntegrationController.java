package com.hanghai.kchtg.businessintegration.controller;

import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.dto.BusinessIntegrationStatistics;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import com.hanghai.kchtg.businessintegration.service.BusinessIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/business-integrations")
public class BusinessIntegrationController {

    @Autowired
    private BusinessIntegrationService integrationService;

    @PostMapping
    public ResponseEntity<BusinessDataIntegrationResponse> createIntegration(
            @RequestBody BusinessDataIntegrationRequest request) {
        return ResponseEntity.ok(integrationService.createIntegration(request));
    }

    @GetMapping("/type/{integrationType}")
    public ResponseEntity<List<BusinessDataIntegrationResponse>> findByType(
            @PathVariable String integrationType) {
        return ResponseEntity.ok(integrationService.findByType(
            IntegrationType.valueOf(integrationType.toUpperCase())));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<BusinessDataIntegrationResponse>> findByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(integrationService.findByStatus(
            IntegrationStatus.valueOf(status.toUpperCase())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessDataIntegrationResponse> findById(
            @PathVariable String id) {
        BusinessDataIntegrationResponse response = integrationService.findById(id);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<BusinessDataIntegrationResponse> processIntegration(
            @PathVariable String id) {
        return ResponseEntity.ok(integrationService.processIntegration(id));
    }

    @GetMapping("/statistics")
    public ResponseEntity<BusinessIntegrationStatistics> getStatistics() {
        return ResponseEntity.ok(integrationService.getStatistics());
    }
}
