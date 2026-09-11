package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.dto.document.DocumentResponse;
import com.hanghai.kchtg.port.entity.Document;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.DocumentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Dịch vụ quản lý giấy tờ / tài liệu đính kèm (Document).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/tiff"
    );

    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "pdf",
            "docx",
            "doc",
            "xls",
            "xlsx",
            "jpeg",
            "jpg",
            "png",
            "webp",
            "tiff",
            "tif"
    );

    private final DocumentRepository documentRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final PortRepository portRepository;
    private final BuoyStationRepository buoyStationRepository;
    private final BuoyRepository buoyRepository;

    @Transactional
    public DocumentResponse uploadFile(String entityType, String entityId,
                                      MultipartFile file, String originalFilename,
                                      String contentType, long fileSize, String uploadedBy,
                                      Boolean skipHistory)
            throws IOException {

        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType không được để trống");
        }

        if (entityId == null || entityId.isBlank()) {
            throw new IllegalArgumentException("entityId không được để trống");
        }

        validateMimeType(contentType);
        validateFileSize(fileSize);

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Tên file không được để trống");
        }

        // 1. Summary danh sách file cũ trước khi upload
        List<Document> existingDocs = documentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        List<String> fileListBefore = existingDocs.stream()
                .map(Document::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        String oldFilesSummary = String.join(", ", fileListBefore);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String storageKey = generateStorageKey(entityType, entityId, timestamp, originalFilename);

        log.info("[DocumentService.uploadFile] MinIO upload (STUB): bucket={}, key={}",
                "cangben-documents", storageKey);

        Document entity = Document.builder()
                .entityType(entityType)
                .entityId(entityId)
                .fileName(originalFilename)
                .fileSize(fileSize)
                .mimeType(contentType != null ? contentType : "application/octet-stream")
                .storageKey(storageKey)
                .uploadedBy(uploadedBy)
                .build();

        Document saved = documentRepository.save(entity);
        log.info("[DocumentService.uploadFile] Saved Document [{}] for entity={} {}",
                saved.getId(), entityType, entityId);

        // 2. Summary danh sách file mới sau khi upload
        List<String> fileListAfter = new ArrayList<>(fileListBefore);
        if (originalFilename != null && !originalFilename.isBlank() && !fileListAfter.contains(originalFilename.trim())) {
            fileListAfter.add(originalFilename.trim());
        }
        String newFilesSummary = String.join(", ", fileListAfter);

        recordPortAttachmentHistory(entityType, entityId, oldFilesSummary, newFilesSummary, originalFilename,
                InfrastructureHistoryStatus.ATTACHMENT_UPLOADED, skipHistory);

        return toResponse(saved);
    }

    @Transactional
    public DocumentResponse uploadFile(String entityType, String entityId,
                                      MultipartFile file, String originalFilename,
                                      String contentType, long fileSize, String uploadedBy)
            throws IOException {
        return uploadFile(entityType, entityId, file, originalFilename, contentType, fileSize, uploadedBy, null);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> listByEntity(String entityType, String entityId, int page, int size) {
        int pageSize = Math.min(Math.max(size, 1), 100);

        List<Document> entities = documentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);

        int start = (int) Math.min(page * pageSize, entities.size());
        int end = Math.min((page + 1) * pageSize, entities.size());
        List<Document> paged = entities.subList(start, end);

        List<DocumentResponse> responseList = paged.stream()
                .map(this::toResponse)
                .toList();

        // Không dùng Page.empty(): nó bọc Pageable.unpaged(), khi Jackson serialize sẽ
        // gọi Unpaged.getOffset() -> UnsupportedOperationException -> HTTP 500.
        // Luôn dùng PageImpl với PageRequest thật để JSON page luôn hợp lệ.
        Page<DocumentResponse> result = new PageImpl<>(responseList, PageRequest.of(page, pageSize), entities.size());

        log.info("[DocumentService.listByEntity] entityType={}, entityId={}, page={}, size={}, total={}",
                entityType, entityId, page, size, entities.size());

        return result;
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listByEntity(String entityType, String entityId) {
        List<Document> entities = documentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        log.info("[DocumentService.listByEntity] entityType={}, entityId={}, count={}",
                entityType, entityId, entities.size());
        return entities.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(UUID id) {
        Document entity = documentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy giấy tờ với id: " + id));
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID id, String userId, Boolean skipHistory) {
        Document entity = documentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy giấy tờ với id: " + id));

        log.info("[DocumentService.delete] MinIO delete (STUB): key={}", entity.getStorageKey());

        // 1. Summary danh sách file trước khi xóa
        List<Document> existingDocs = documentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entity.getEntityType(), entity.getEntityId());
        String oldFilesSummary = existingDocs.stream()
                .map(Document::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        // 2. Summary danh sách file sau khi xóa
        String newFilesSummary = existingDocs.stream()
                .filter(d -> !d.getId().equals(id))
                .map(Document::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        entity.softDelete(SecurityUtils.getCurrentUserId());
        entity.setUpdatedBy(UUID.fromString(userId));
        documentRepository.save(entity);

        recordPortAttachmentHistory(entity.getEntityType(), entity.getEntityId(), oldFilesSummary, newFilesSummary,
                entity.getFileName(), InfrastructureHistoryStatus.ATTACHMENT_DELETED, skipHistory);

        log.info("[DocumentService.delete] Soft-deleted Document [{}] key={}, deletedBy={}",
                id, entity.getStorageKey(), userId);
    }

    @Transactional
    public void delete(UUID id, String userId) {
        delete(id, userId, null);
    }

    /**
     * Ghi lịch sử thay đổi file đính kèm dạng snapshot bảng (chuẩn Cảng biển PortService).
     * Chỉ ghi khi entityType = "port", "buoy" hoặc "buoy-station" và hồ sơ đã duyệt.
     */
    private void recordPortAttachmentHistory(String entityType, String entityId, String oldFilesSummary, String newFilesSummary,
                                             String affectedFileName, InfrastructureHistoryStatus status, Boolean skipHistory) {
        try {
            if (Boolean.TRUE.equals(skipHistory)) {
                return;
            }
            boolean isPort = "port".equalsIgnoreCase(entityType);
            boolean isBuoy = "buoy".equalsIgnoreCase(entityType);
            boolean isBuoyStation = "buoy-station".equalsIgnoreCase(entityType);
            if ((!isPort && !isBuoy && !isBuoyStation) || historyRepository == null) {
                return;
            }
            UUID refId = UUID.fromString(entityId);
            InfrastructureType refType;
            String entityLabel;
            if (isPort) {
                Port port = portRepository.findById(refId).orElse(null);
                if (port == null) {
                    return;
                }
                ApprovalStatus approval = port.getApprovalStatus();
                boolean wasApproved = approval == ApprovalStatus.APPROVED
                        || approval == ApprovalStatus.APPROVED_LEVEL2;
                if (!wasApproved) {
                    return;
                }
                // Guard: Thêm mới cảng biển không bao giờ ghi lịch sử đính kèm (createdAt trùng/sát updatedAt)
                if (port.getCreatedAt() != null && port.getUpdatedAt() != null) {
                    long diffSec = Math.abs(java.time.Duration.between(port.getCreatedAt(), port.getUpdatedAt()).toSeconds());
                    if (diffSec <= 5 && !Boolean.FALSE.equals(skipHistory)) {
                        return;
                    }
                }
                refType = InfrastructureType.SEAPORT;
                entityLabel = "Cảng biển";
            } else if (isBuoy) {
                Buoy buoy = buoyRepository.findById(refId).orElse(null);
                if (buoy == null) {
                    return;
                }
                ApprovalStatus approval = buoy.getApprovalStatus();
                boolean wasApproved = approval == ApprovalStatus.APPROVED
                        || approval == ApprovalStatus.APPROVED_LEVEL2;
                if (!wasApproved) {
                    return;
                }
                // Guard: Thêm mới phao tiêu không bao giờ ghi lịch sử đính kèm
                if (buoy.getCreatedAt() != null && buoy.getUpdatedAt() != null) {
                    long diffSec = Math.abs(java.time.Duration.between(buoy.getCreatedAt(), buoy.getUpdatedAt()).toSeconds());
                    if (diffSec <= 5 && !Boolean.FALSE.equals(skipHistory)) {
                        return;
                    }
                }
                refType = InfrastructureType.BUOY;
                entityLabel = "Phao tiêu";
            } else {
                BuoyStation station = buoyStationRepository.findById(refId).orElse(null);
                if (station == null) {
                    return;
                }
                ApprovalStatus approval = station.getApprovalStatus();
                boolean wasApproved = approval == ApprovalStatus.APPROVED
                        || approval == ApprovalStatus.APPROVED_LEVEL2;
                if (!wasApproved) {
                    return;
                }
                // Guard: Thêm mới nhà trạm phao tiêu không bao giờ ghi lịch sử đính kèm
                if (station.getCreatedAt() != null && station.getUpdatedAt() != null) {
                    long diffSec = Math.abs(java.time.Duration.between(station.getCreatedAt(), station.getUpdatedAt()).toSeconds());
                    if (diffSec <= 5 && !Boolean.FALSE.equals(skipHistory)) {
                        return;
                    }
                }
                refType = InfrastructureType.BUOY_STATION;
                entityLabel = "Nhà trạm phao tiêu";
            }

            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            if (Objects.equals(oldVal, newVal)) {
                return;
            }

            String name = affectedFileName != null ? affectedFileName : "không rõ tên";
            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(refId)
                    .refType(refType)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .approvedDate(LocalDateTime.now())
                    .reason((uploaded ? "Tải lên tài liệu đính kèm: " : "Xóa tài liệu đính kèm: ") + name)
                    .changedField("File đính kèm")
                    .previousValue(oldVal)
                    .newValue(newVal)
                    .build());
            log.info("[DocumentService] Đã ghi lịch sử {} file đính kèm của {} [{}]: [{}] -> [{}]",
                    uploaded ? "tải lên" : "xóa", entityLabel, refId, oldVal, newVal);
        } catch (Exception e) {
            log.warn("[DocumentService] Không ghi được lịch sử file đính kèm (entityType={}, entityId={}): {}",
                    entityType, entityId, e.getMessage());
        }
    }

    private DocumentResponse toResponse(Document entity) {
        return DocumentResponse.builder()
                .id(entity.getId())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .fileName(entity.getFileName())
                .fileSize(entity.getFileSize())
                .mimeType(entity.getMimeType())
                .storageKey(entity.getStorageKey())
                .uploadedBy(entity.getUploadedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private String generateStorageKey(String entityType, String entityId,
                                    String timestamp, String originalFilename) {
        String baseName = originalFilename;
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = originalFilename.substring(0, dotIndex);
        }
        return String.format("%s/%s/%s_%s", entityType, entityId, timestamp, baseName);
    }

    private void validateMimeType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("Không xác định được MIME type của file");
        }

        String normalized = contentType.toLowerCase().trim();
        if (!ALLOWED_MIME_TYPES.contains(normalized)) {
            log.warn("[DocumentService] MIME type bị từ chối: {}", contentType);
            throw new IllegalArgumentException(
                    "Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, WEBP, TIFF");
        }
    }

    private void validateFileSize(long fileSize) {
        if (fileSize <= 0) {
            throw new IllegalArgumentException("Kích thước file không hợp lệ");
        }
        if (fileSize > MAX_FILE_SIZE) {
            long maxMB = MAX_FILE_SIZE / (1024 * 1024);
            long fileMB = fileSize / (1024 * 1024);
            throw new IllegalArgumentException(
                    String.format("File quá lớn (%d MB). Kích thước tối đa: %d MB", fileMB, maxMB));
        }
    }

    private <T> Page<T> createPage(List<T> content, long totalElements, int page, int size) {
        return new PageImpl<>(content, PageRequest.of(page, size), totalElements);
    }
}
