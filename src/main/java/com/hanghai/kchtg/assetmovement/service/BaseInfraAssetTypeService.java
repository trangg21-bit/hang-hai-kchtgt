package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.port.entity.Attachment;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Lớp cơ sở cho các Service tài sản KCHT riêng biệt.
 * Đảm bảo gán đúng InfraAssetType và ủy nhiệm logic chung sang InfraAssetService.
 */
public abstract class BaseInfraAssetTypeService {

    protected final InfraAssetService infraAssetService;
    protected final InfraAssetType assetType;

    protected BaseInfraAssetTypeService(InfraAssetService infraAssetService, InfraAssetType assetType) {
        this.infraAssetService = infraAssetService;
        this.assetType = assetType;
    }

    public InfraAssetType getAssetType() {
        return assetType;
    }

    @Transactional
    public InfraAssetResponse create(InfraAssetRequest request) {
        request.setAssetType(assetType);
        return infraAssetService.create(request);
    }

    public InfraAssetResponse getById(UUID id) {
        return infraAssetService.getById(id);
    }

    @Transactional
    public InfraAssetResponse update(UUID id, InfraAssetRequest request) {
        request.setAssetType(assetType);
        return infraAssetService.update(id, request);
    }

    @Transactional
    public void delete(UUID id) {
        infraAssetService.delete(id);
    }

    public Object getHistory(UUID id) {
        return infraAssetService.getHistory(id);
    }

    @Transactional
    public List<InfraAssetAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        return infraAssetService.uploadAttachments(id, files, userId);
    }

    public List<InfraAssetAttachmentResponse> listAttachments(UUID id) {
        return infraAssetService.listAttachments(id);
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attId, UUID userId) {
        infraAssetService.deleteAttachment(id, attId, userId);
    }

    public Attachment getAttachment(UUID id, UUID attId) {
        return infraAssetService.getAttachment(id, attId);
    }
}
