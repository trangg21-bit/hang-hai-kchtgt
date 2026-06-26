package com.hanghai.kchtg.datasharing.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.datasharing.dto.ShareFilter;
import com.hanghai.kchtg.datasharing.dto.ShareSummary;
import com.hanghai.kchtg.datasharing.dto.SharedDataRequest;
import com.hanghai.kchtg.datasharing.dto.SharedDataResponse;
import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.service.ShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for chia sẻ dữ liệu KCHTGT (data sharing module) — M-018.
 * Covers CRUD, status management, counting and summary for all 18 KCHTGT asset types.
 * <p>
 * Asset types: Port, Dock, BuoyBerth, TransferArea, TransitArea, Anchorage,
 * RepairFacility, Lighthouse, BuoySign, VtsSystem, VtsControlCenter,
 * RadarStation, AisSystem, CctvSystem, ScadaSystem, VhfInfoSystem,
 * TelecommSystem, VtsAssistSystem.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/datasharing")
@RequiredArgsConstructor
@Validated
public class ShareController {

    private final ShareService shareService;

    /**
     * Share a new KCHTGT data record (Bến cảng, Cầu cảng, Phao tiêu, …).
     * Creates the record with initial status DRAFT and returns the full response.
     *
     * @param request the share request containing dataType, sharedWith, fileUrl, etc.
     * @return 200 OK with the created SharedDataResponse
     */
    @PostMapping("/shares")
    public ResponseEntity<ApiResponse<SharedDataResponse>> share(
            @Valid @RequestBody SharedDataRequest request) {
        log.info("Creating share: dataType={}, sharedWith={}",
                request.getDataType(), request.getSharedWith());
        SharedDataResponse response = shareService.share(request);
        return ResponseEntity.ok(
                ApiResponse.success("Chia sẻ dữ liệu thành công", response));
    }

    /**
     * Find a shared data record by its database ID.
     *
     * @param id the primary key of the shared_data record
     * @return 200 OK with the SharedDataResponse, or 404 if not found
     */
    @GetMapping("/shares/{id}")
    public ResponseEntity<ApiResponse<SharedDataResponse>> findById(
            @PathVariable Long id) {
        log.info("Finding shared data by id={}", id);
        return shareService.findById(id)
                .map(response -> ResponseEntity.ok(
                        ApiResponse.success("Đã tìm thấy dữ liệu chia sẻ", response)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Find a shared data record by its business code (e.g. "SD-2026-0001").
     *
     * @param code the business code of the shared_data record
     * @return 200 OK with the SharedDataResponse, or 404 if not found
     */
    @GetMapping("/shares/code/{code}")
    public ResponseEntity<ApiResponse<SharedDataResponse>> findByCode(
            @PathVariable String code) {
        log.info("Finding shared data by code={}", code);
        return shareService.findByCode(code)
                .map(response -> ResponseEntity.ok(
                        ApiResponse.success("Đã tìm thấy dữ liệu chia sẻ", response)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List all shared data records with optional filtering and pagination.
     * Supports query params: dataType, shareStatus, sharedWith, year, page, size.
     *
     * @param filter the optional filter criteria
     * @return 200 OK with a paginated list of SharedDataResponse
     */
    @GetMapping("/shares")
    public ResponseEntity<ApiResponse<Page<SharedDataResponse>>> findAll(
            @ModelAttribute ShareFilter filter) {
        log.info("Listing shared data with filter: {}", filter);
        Page<SharedDataResponse> page = shareService.findAll(filter);
        return ResponseEntity.ok(
                ApiResponse.success("Đã lấy danh sách dữ liệu chia sẻ", page));
    }

    /**
     * List all shares of a specific KCHTGT asset type.
     * Covers all 18 types: PORT, DOCK, BUOY_BERTH, TRANSFER_AREA, TRANSIT_AREA,
     * ANCHORAGE, REPAIR_FACILITY, LIGHTHOUSE, BUOY_SIGN, VTS_SYSTEM,
     * VTS_CONTROL_CENTER, RADAR_STATION, AIS_SYSTEM, CCTV_SYSTEM,
     * SCADA_SYSTEM, VHF_INFO_SYSTEM, TELECOMM_SYSTEM, VTS_ASSIST_SYSTEM.
     *
     * @param dataType the ShareDataType enum value (e.g. PORT)
     * @return 200 OK with a list of SharedDataResponse for the given type
     */
    @GetMapping("/shares/type/{dataType}")
    public ResponseEntity<ApiResponse<?>> findByDataType(
            @PathVariable String dataType) {
        log.info("Finding shared data by dataType={}", dataType);
        // Validate the dataType against known enum values
        try {
            ShareDataType.valueOf(dataType);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Loại dữ liệu không hợp lệ: " + dataType));
        }
        List<SharedDataResponse> result = shareService.findByDataType(dataType);
        return ResponseEntity.ok(
                ApiResponse.success("Đã tìm theo loại dữ liệu", result));
    }

    /**
     * List all shares sent to a specific recipient organization.
     *
     * @param sharedWith the recipient organization code or name
     * @return 200 OK with a list of SharedDataResponse for the given recipient
     */
    @GetMapping("/shares/recipient/{sharedWith}")
    public ResponseEntity<ApiResponse<?>> findByRecipient(
            @PathVariable String sharedWith) {
        log.info("Finding shared data by recipient={}", sharedWith);
        List<SharedDataResponse> result = shareService.findBySharedWith(sharedWith);
        return ResponseEntity.ok(
                ApiResponse.success("Đã tìm theo người nhận", result));
    }

    /**
     * Revoke a shared data record (DRAFT/SHARED → REVOKED).
     *
     * @param id the primary key of the shared_data record to revoke
     * @return 200 OK with success message
     */
    @PutMapping("/shares/{id}/revoke")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @PathVariable Long id) {
        log.info("Revoking share [{}]", id);
        shareService.revoke(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã thu hồi dữ liệu chia sẻ", null));
    }

    /**
     * Count the number of shared data records with a given status.
     * Status values: DRAFT, SHARED, REVOKED, EXPIRED.
     *
     * @param status the share status to count
     * @return 200 OK with the count
     */
    @GetMapping("/shares/count-by-status/{status}")
    public ResponseEntity<ApiResponse<Long>> countByStatus(
            @PathVariable String status) {
        log.info("Counting shares by status={}", status);
        long count = shareService.countByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.success("Đếm dữ liệu theo trạng thái", count));
    }

    /**
     * Retrieve an aggregated summary of all shared data records.
     * Includes totals by status (active, revoked, expired) and total record count.
     *
     * @return 200 OK with a ShareSummary
     */
    @GetMapping("/shares/summary")
    public ResponseEntity<ApiResponse<ShareSummary>> getSummary() {
        log.info("Fetching share summary");
        ShareSummary summary = shareService.getSummary();
        return ResponseEntity.ok(
                ApiResponse.success("Lấy tổng kết chia sẻ dữ liệu thành công", summary));
    }

    /**
     * List all available KCHTGT data types (asset categories) that can be shared.
     * Returns the 18 enum values from ShareDataType with their Vietnamese labels.
     * Useful for populating dropdowns in front-end share forms.
     *
     * @return 200 OK with a list of data-type descriptors (name + label)
     */
    @GetMapping("/types")
    public ResponseEntity<ApiResponse<?>> listTypes() {
        log.info("Listing available data types");
        ShareDataType[] types = ShareDataType.values();
        java.util.List<String> typeList = new java.util.ArrayList<>();
        for (ShareDataType type : types) {
            typeList.add(type.name() + " (" + type.getLabel() + ")");
        }
        return ResponseEntity.ok(
                ApiResponse.success("Đã lấy danh sách loại dữ liệu", typeList));
    }

    /**
     * Delete (hard-remove) a shared data record by its database ID.
     * This is a destructive operation — use with caution.
     *
     * @param id the primary key of the shared_data record to delete
     * @return 200 OK with success message, or 404 if not found
     */
    @DeleteMapping("/shares/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id) {
        log.info("Deleting share [{}]", id);
        if (!shareService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        shareService.revoke(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa dữ liệu chia sẻ", null));
    }
}
