package com.hanghai.kchtg.coastalstationasset.service;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.coastalstationasset.dto.CoastalStationAdjustmentRequest;
import com.hanghai.kchtg.coastalstationasset.dto.CoastalStationExploitationRequest;
import com.hanghai.kchtg.coastalstationasset.dto.CoastalStationAssetRequest;
import com.hanghai.kchtg.coastalstationasset.dto.CoastalStationAssetResponse;
import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAssetAdjustment;
import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAssetExploitation;
import com.hanghai.kchtg.port.entity.Attachment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class DaiTtdhAssetService {

    public static final String ASSET_TYPE = "Tài sản đài TTDH";

    private final CoastalStationAssetService service;

    public DaiTtdhAssetService(CoastalStationAssetService service) {
        this.service = service;
    }

    @Transactional
    public CoastalStationAssetResponse create(CoastalStationAssetRequest request) {
        request.setAssetType(ASSET_TYPE);
        return service.create(request);
    }

    public CoastalStationAssetResponse getById(UUID id) {
        return service.getById(id);
    }

    public Object getHistory(UUID id) {
        return service.getHistory(id);
    }

    public Page<CoastalStationAssetResponse> findAll(
            String assetCode, String assetName, UUID parentOrgUnitId, UUID orgUnitId, UUID usingOrgUnitId,
            UUID stationId, String assetCondition, String approvalStatus,
            LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {
        return service.findAll(assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                stationId, assetCondition, approvalStatus, ASSET_TYPE, updatedFrom, updatedTo, pageable);
    }

    public Map<String, Long> getCounts(
            String assetCode, String assetName, UUID parentOrgUnitId, UUID orgUnitId, UUID usingOrgUnitId,
            UUID stationId, String assetCondition, LocalDate updatedFrom, LocalDate updatedTo) {
        return service.countByApprovalStatus(assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                stationId, assetCondition, ASSET_TYPE, updatedFrom, updatedTo);
    }

    @Transactional
    public CoastalStationAssetResponse update(UUID id, CoastalStationAssetRequest request) {
        request.setAssetType(ASSET_TYPE);
        return service.update(id, request);
    }

    @Transactional
    public void delete(UUID id) {
        service.delete(id);
    }

    public List<CoastalStationAssetExploitation> getExploitations(UUID assetId) {
        return service.getExploitations(assetId);
    }

    @Transactional
    public CoastalStationAssetExploitation addExploitation(UUID assetId, CoastalStationExploitationRequest request) {
        return service.addExploitation(assetId, request);
    }

    public List<CoastalStationAssetAdjustment> getAdjustments(UUID assetId, String adjustmentType) {
        return service.getAdjustments(assetId, adjustmentType);
    }

    @Transactional
    public CoastalStationAssetAdjustment addAdjustment(UUID assetId, CoastalStationAdjustmentRequest request) {
        return service.addAdjustment(assetId, request);
    }

    @Transactional
    public List<InfraAssetAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        return service.uploadAttachments(id, files, userId);
    }

    public List<InfraAssetAttachmentResponse> listAttachments(UUID id) {
        return service.listAttachments(id);
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attId, UUID userId) {
        service.deleteAttachment(id, attId, userId);
    }

    public Attachment getAttachment(UUID id, UUID attId) {
        return service.getAttachment(id, attId);
    }
}
