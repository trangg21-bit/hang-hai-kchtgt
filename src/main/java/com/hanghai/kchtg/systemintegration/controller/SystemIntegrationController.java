package com.hanghai.kchtg.systemintegration.controller;

import com.hanghai.kchtg.systemintegration.dto.IntegrationStatistics;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import com.hanghai.kchtg.systemintegration.service.SystemIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/integrations")
public class SystemIntegrationController {

    @Autowired
    private SystemIntegrationService integrationService;

    @PostMapping
    public ResponseEntity<SystemIntegrationResponse> createIntegration(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(integrationService.createIntegration(request));
    }

    @GetMapping("/type/{integrationType}")
    public ResponseEntity<List<SystemIntegrationResponse>> findByType(
            @PathVariable String integrationType) {
        return ResponseEntity.ok(integrationService.findByType(
            IntegrationType.valueOf(integrationType.toUpperCase())));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SystemIntegrationResponse>> findByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(integrationService.findByStatus(
            IntegrationStatus.valueOf(status.toUpperCase())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SystemIntegrationResponse> findById(
            @PathVariable String id) {
        SystemIntegrationResponse response = integrationService.findById(id);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<SystemIntegrationResponse> processIntegration(
            @PathVariable String id) {
        return ResponseEntity.ok(integrationService.processIntegration(id));
    }

    @GetMapping("/statistics")
    public ResponseEntity<IntegrationStatistics> getStatistics() {
        return ResponseEntity.ok(integrationService.getStatistics());
    }
}
