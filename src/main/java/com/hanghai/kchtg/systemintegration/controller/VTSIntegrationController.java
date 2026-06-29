package com.hanghai.kchtg.systemintegration.controller;

import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.service.VTSIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vts-integrations")
public class VTSIntegrationController {

    @Autowired
    private VTSIntegrationService vtsIntegrationService;

    @PostMapping("/vts-data")
    public ResponseEntity<SystemIntegrationResponse> integrateVTSData(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(vtsIntegrationService.integrateVTSData(request));
    }

    @PostMapping("/operation-info")
    public ResponseEntity<SystemIntegrationResponse> integrateVTSOperationInfo(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(vtsIntegrationService.integrateVTSOperationInfo(request));
    }

    @PostMapping("/radar")
    public ResponseEntity<SystemIntegrationResponse> integrateRadarData(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(vtsIntegrationService.integrateRadarData(request));
    }

    @PostMapping("/ais")
    public ResponseEntity<SystemIntegrationResponse> integrateAISData(
            @RequestBody SystemIntegrationRequest request) {
        return ResponseEntity.ok(vtsIntegrationService.integrateAISData(request));
    }
}
