package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.integration.dto.SyncTriggerResponse;
import com.hanghai.kchtg.integration.entity.IntegrationSyncJob;
import com.hanghai.kchtg.integration.service.PortCargoIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/kchtgt")
@PreAuthorize("@auth.check(authentication, 'admin:manage')")
public class PortCargoIntegrationController {

    private final PortCargoIntegrationService integrationService;

    public PortCargoIntegrationController(PortCargoIntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @PostMapping("/berth/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncBerth(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-227", connectionId);
    }

    @PostMapping("/wharf/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncWharf(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-228", connectionId);
    }

    @PostMapping("/buoy/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncBuoy(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-229", connectionId);
    }

    @PostMapping("/danger-zone/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncDangerZone(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-230", connectionId);
    }

    @PostMapping("/transport-zone/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncTransportZone(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-231", connectionId);
    }

    @PostMapping("/anchorage/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncAnchorage(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-232", connectionId);
    }

    @PostMapping("/repair-facility/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncRepairFacility(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-233", connectionId);
    }

    @PostMapping("/beacon-info/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncBeaconInfo(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-234", connectionId);
    }

    @PostMapping("/buoy-signal/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncBuoySignal(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-235", connectionId);
    }

    @PostMapping("/vts/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVts(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-236", connectionId);
    }

    @PostMapping("/vts/operations/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVtsOperations(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-237", connectionId);
    }

    @PostMapping("/radar/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncRadar(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-238", connectionId);
    }

    @PostMapping("/ais/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncAis(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-239", connectionId);
    }

    @PostMapping("/cctv/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCctv(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-240", connectionId);
    }

    @PostMapping("/scada/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncScada(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-241", connectionId);
    }

    @PostMapping("/vhf-info/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVhfInfo(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-242", connectionId);
    }

    @PostMapping("/transmission/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncTransmission(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-243", connectionId);
    }

    @PostMapping("/vts-support/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVtsSupport(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-244", connectionId);
    }

    @PostMapping("/breakwater/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncBreakwater(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-245", connectionId);
    }

    @PostMapping("/cargo/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCargo(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-246", connectionId);
    }

    @PostMapping("/operation-center/ttdh/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncOperationCenterTtdh(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-247", connectionId);
    }

    @PostMapping("/operation-center/inmarsat/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncOperationCenterInmarsat(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-248", connectionId);
    }

    @PostMapping("/operation-center/cospas-sarsat/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncOperationCenterCospasSarsat(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-249", connectionId);
    }

    @PostMapping("/operation-center/lrit/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncOperationCenterLrit(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-250", connectionId);
    }

    @PostMapping("/operation-center/haiphong/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncOperationCenterHaiphong(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-251", connectionId);
    }

    @PostMapping("/port-status/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncPortStatus(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-252", connectionId);
    }

    @PostMapping("/electronic-chart/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncElectronicChart(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-253", connectionId);
    }

    @PostMapping("/vessel/inbound-outbound/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselInboundOutbound(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-254", connectionId);
    }

    @PostMapping("/vessel/inland/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselInland(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-255", connectionId);
    }

    @PostMapping("/vessel/foreign/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselForeign(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-256", connectionId);
    }

    @PostMapping("/vessel/international/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselInternational(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-257", connectionId);
    }

    @PostMapping("/cargo/passenger/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCargoPassenger(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-258", connectionId);
    }

    @PostMapping("/vessel-traffic/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselTraffic(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-259", connectionId);
    }

    @PostMapping("/cargo/domestic/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCargoDomestic(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-260", connectionId);
    }

    @PostMapping("/cargo/managed-area/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCargoManagedArea(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-261", connectionId);
    }

    @PostMapping("/pilot/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncPilot(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-262", connectionId);
    }

    @PostMapping("/vessel/vietnamese/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselVietnamese(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-263", connectionId);
    }

    @PostMapping("/vessel/pilot-boat/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncVesselPilotBoat(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-264", connectionId);
    }

    @PostMapping("/dock-repair/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncDockRepair(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-265", connectionId);
    }

    @PostMapping("/berth-capacity/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncBerthCapacity(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-266", connectionId);
    }

    @PostMapping("/port-capacity/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncPortCapacity(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-267", connectionId);
    }

    @PostMapping("/cargo/monthly/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCargoMonthly(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-268", connectionId);
    }

    @PostMapping("/cargo/annual/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncCargoAnnual(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-269", connectionId);
    }

    @PostMapping("/transport-service/sync")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> syncTransportService(@RequestParam(required = false) UUID connectionId) {
        return triggerSync("F-270", connectionId);
    }

    @PostMapping("/sync/retry/{jobId}")
    public ResponseEntity<ApiResponse<SyncTriggerResponse>> retrySync(@PathVariable UUID jobId) {
        IntegrationSyncJob job = integrationService.retrySyncJob(jobId);
        SyncTriggerResponse response = SyncTriggerResponse.builder()
                .syncId(job.getId())
                .status("accepted")
                .message("Sync job retry triggered successfully")
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(ApiResponse.success("Sync job retry triggered successfully", response));
    }

    private ResponseEntity<ApiResponse<SyncTriggerResponse>> triggerSync(String featureCode, UUID connectionId) {
        IntegrationSyncJob job = integrationService.executeSync(featureCode, connectionId);
        SyncTriggerResponse response = SyncTriggerResponse.builder()
                .syncId(job.getId())
                .status("accepted")
                .message("Sync job triggered successfully")
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(ApiResponse.success("Sync job triggered successfully", response));
    }
}