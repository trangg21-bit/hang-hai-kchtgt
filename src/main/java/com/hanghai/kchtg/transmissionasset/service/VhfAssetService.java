package com.hanghai.kchtg.transmissionasset.service;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAdjustmentRequest;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAssetRequest;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAssetResponse;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionExploitationRequest;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetAdjustment;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetExploitation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class VhfAssetService {

    public static final String ASSET_TYPE = "Tài sản HTTT liên lạc VHF";

    private final TransmissionAssetService service;

    public VhfAssetService(TransmissionAssetService service) {
        this.service = service;
    }

    @Transactional
    public TransmissionAssetResponse create(TransmissionAssetRequest request) {
        request.setAssetType(ASSET_TYPE);
        return service.create(request);
    }

    public TransmissionAssetResponse getById(UUID id) {
        return service.getById(id);
    }

    public Object getHistory(UUID id) {
        return service.getHistory(id);
    }

    public Page<TransmissionAssetResponse> findAll(
            String assetCode, String assetName, UUID parentOrgUnitId, UUID orgUnitId, UUID usingOrgUnitId,
            UUID transmissionId, String assetCondition, String approvalStatus,
            LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {
        return service.findAll(assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                transmissionId, assetCondition, approvalStatus, ASSET_TYPE, updatedFrom, updatedTo, pageable);
    }

    @Transactional
    public TransmissionAssetResponse update(UUID id, TransmissionAssetRequest request) {
        request.setAssetType(ASSET_TYPE);
        return service.update(id, request);
    }

    @Transactional
    public void delete(UUID id) {
        service.delete(id);
    }

    public List<TransmissionAssetExploitation> getExploitations(UUID assetId) {
        return service.getExploitations(assetId);
    }

    @Transactional
    public TransmissionAssetExploitation addExploitation(UUID assetId, TransmissionExploitationRequest request) {
        return service.addExploitation(assetId, request);
    }

    public List<TransmissionAssetAdjustment> getAdjustments(UUID assetId, String adjustmentType) {
        return service.getAdjustments(assetId, adjustmentType);
    }

    @Transactional
    public TransmissionAssetAdjustment addAdjustment(UUID assetId, TransmissionAdjustmentRequest request) {
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
