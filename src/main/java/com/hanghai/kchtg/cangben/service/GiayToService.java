package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.giayto.GiayToResponse;
import com.hanghai.kchtg.cangben.entity.GiayTo;
import com.hanghai.kchtg.cangben.repository.GiayToRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Dịch vụ quản lý giấy tờ / tài liệu đính kèm (GiayTo).
 * <p>
 * Bao gồm các hoạt động: upload file, liệt kê theo entity, lấy theo id, xóa.
 * <p>
 * Quy tắc nghiệp vụ:
 * - Chỉ chấp nhận các MIME type: PDF, DOCX, JPEG, JPG, PNG
 * - Kích thước file tối đa: 10MB (10 * 1024 * 1024 bytes)
 * - MinIO integration là stub (chỉ log key, không gọi API MinIO thật)
 * - Khi xóa file: xóa cả trên MinIO (stub) và soft-delete bản ghi DB
 * </p>
 *
 * Covers features F-008..F-037 shared (GiayTo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GiayToService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Các MIME type được phép.
     */
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    /**
     * Các định dạng file được phép (dựa trên extension).
     */
    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "pdf",
            "docx",
            "jpeg",
            "jpg",
            "png"
    );

    private final GiayToRepository giayToRepository;

    // ── UPLOAD FILE ──────────────────────────────────────────────────

    /**
     * Upload file đính kèm cho một entity.
     * <p>
     * Quy trình:
     * 1. Validate MIME type
     * 2. Validate kích thước file
     * 3. Sinh MinIO object key
     * 4. Upload lên MinIO (stub: chỉ log key)
     * 5. Lưu bản ghi GiayTo vào DB
     * 6. Nếu MinIO upload thất bại → rollback bản ghi DB
     * </p>
     *
     * @param entityType     loại entity (cang-bien, ben-cang, ...)
     * @param entityId       ID của entity (UUID string)
     * @param file           file upload
     * @param originalFilename tên gốc của file
     * @param contentType    MIME type từ file upload
     * @param fileSize       kích thước file (bytes)
     * @param uploadedBy     ID người upload
     * @return GiayToResponse đã tạo
     * @throws IllegalArgumentException nếu MIME type không hợp lệ hoặc file quá lớn
     * @throws IOException              nếu có lỗi khi xử lý file
     */
    @Transactional
    public GiayToResponse uploadFile(String entityType, String entityId,
                                     MultipartFile file, String originalFilename,
                                     String contentType, long fileSize, String uploadedBy)
            throws IOException {

        // 1. Validate entityType
        if (entityType == null || entityType.isBlank()) {
            throw new IllegalArgumentException("entityType không được để trống");
        }

        // 2. Validate entityId
        if (entityId == null || entityId.isBlank()) {
            throw new IllegalArgumentException("entityId không được để trống");
        }

        // 3. Validate MIME type
        validateMimeType(contentType);

        // 4. Validate file size
        validateFileSize(fileSize);

        // 5. Validate original filename (not blank)
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Tên file không được để trống");
        }

        // 6. Generate MinIO object key
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String minioKey = generateMinioKey(entityType, entityId, timestamp, originalFilename);

        // 7. Upload to MinIO (STUB — log the key, no actual MinIO call)
        log.info("[GiayToService.uploadFile] MinIO upload (STUB): bucket={}, key={}",
                "cangben-documents", minioKey);

        // 8. Create and save GiayTo record
        GiayTo entity = GiayTo.builder()
                .entityType(entityType)
                .entityId(entityId)
                .fileName(originalFilename)
                .fileSize(fileSize)
                .mimeType(contentType != null ? contentType : "application/octet-stream")
                .minioKey(minioKey)
                .uploadedBy(uploadedBy)
                .build();

        GiayTo saved = giayToRepository.save(entity);
        log.info("[GiayToService.uploadFile] Saved GiayTo [{}] for entity={} {}",
                saved.getId(), entityType, entityId);

        return toResponse(saved);
    }

    // ── LIST BY ENTITY ───────────────────────────────────────────────

    /**
     * Liệt kê tất cả tài liệu đính kèm cho một entity.
     * Có phân trang: mặc định page=0, size=20, max=100.
     *
     * @param entityType loại entity
     * @param entityId   ID của entity
     * @param page       số trang (0-based)
     * @param size       kích thước trang
     * @return Page of GiayToResponse
     */
    @Transactional(readOnly = true)
    public Page<GiayToResponse> listByEntity(String entityType, String entityId, int page, int size) {
        int pageSize = Math.min(Math.max(size, 1), 100);

        List<GiayTo> entities = giayToRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);

        // Convert to Page manually since findBy* returns List
        int start = (int) Math.min(page * pageSize, entities.size());
        int end = Math.min((page + 1) * pageSize, entities.size());
        List<GiayTo> paged = entities.subList(start, end);

        List<GiayToResponse> responseList = paged.stream()
                .map(this::toResponse)
                .toList();

        Page<GiayToResponse> result;
        if (responseList.isEmpty()) {
            result = Page.empty();
        } else {
            result = new PageImpl<>(responseList, PageRequest.of(page, pageSize), entities.size());
        }

        log.info("[GiayToService.listByEntity] entityType={}, entityId={}, page={}, size={}, total={}",
                entityType, entityId, page, size, entities.size());

        return result;
    }

    /**
     * Liệt kê tất cả tài liệu đính kèm cho một entity (không phân trang).
     *
     * @param entityType loại entity
     * @param entityId   ID của entity
     * @return danh sách GiayToResponse
     */
    @Transactional(readOnly = true)
    public List<GiayToResponse> listByEntity(String entityType, String entityId) {
        List<GiayTo> entities = giayToRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        log.info("[GiayToService.listByEntity] entityType={}, entityId={}, count={}",
                entityType, entityId, entities.size());
        return entities.stream().map(this::toResponse).toList();
    }

    // ── GET BY ID ────────────────────────────────────────────────────

    /**
     * Lấy chi tiết một tài liệu đính kèm theo ID.
     *
     * @param id UUID của bản ghi GiayTo
     * @return GiayToResponse
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public GiayToResponse getById(UUID id) {
        GiayTo entity = giayToRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy giấy tờ với id: " + id));
        return toResponse(entity);
    }

    // ── DELETE ───────────────────────────────────────────────────────

    /**
     * Xóa tài liệu đính kèm (soft-delete DB + xóa MinIO stub).
     *
     * @param id   UUID của bản ghi GiayTo
     * @param userId ID người xóa
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional
    public void delete(UUID id, String userId) {
        GiayTo entity = giayToRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy giấy tờ với id: " + id));

        // Stub: xóa trên MinIO
        log.info("[GiayToService.delete] MinIO delete (STUB): key={}", entity.getMinioKey());

        // Soft-delete DB record
        entity.softDelete();
        entity.setUpdatedBy(userId);
        giayToRepository.save(entity);

        log.info("[GiayToService.delete] Soft-deleted GiayTo [{}] key={}, deletedBy={}",
                id, entity.getMinioKey(), userId);
    }

    // ── HELPERS ──────────────────────────────────────────────────────

    /**
     * Chuyển đổi entity sang response DTO.
     */
    private GiayToResponse toResponse(GiayTo entity) {
        return GiayToResponse.builder()
                .id(entity.getId())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .fileName(entity.getFileName())
                .fileSize(entity.getFileSize())
                .mimeType(entity.getMimeType())
                .minioKey(entity.getMinioKey())
                .uploadedBy(entity.getUploadedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    /**
     * Sinh MinIO object key.
     * Format: {entityType}/{entityId}/{timestamp}_{originalFilename}
     */
    private String generateMinioKey(String entityType, String entityId,
                                    String timestamp, String originalFilename) {
        // Cắt extension để tránh trùng tên
        String baseName = originalFilename;
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = originalFilename.substring(0, dotIndex);
        }
        return String.format("%s/%s/%s_%s", entityType, entityId, timestamp, baseName);
    }

    /**
     * Validate MIME type — chỉ cho phép PDF, DOCX, JPEG, JPG, PNG.
     *
     * @param contentType MIME type từ file upload
     * @throws IllegalArgumentException nếu MIME type không hợp lệ
     */
    private void validateMimeType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("Không xác định được MIME type của file");
        }

        String normalized = contentType.toLowerCase().trim();
        if (!ALLOWED_MIME_TYPES.contains(normalized)) {
            log.warn("[GiayToService] MIME type bị từ chối: {}", contentType);
            throw new IllegalArgumentException(
                    "Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOCX, JPEG, JPG, PNG");
        }
    }

    /**
     * Validate kích thước file — tối đa 10MB.
     *
     * @param fileSize kích thước file (bytes)
     * @throws IllegalArgumentException nếu file quá lớn
     */
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

    /**
     * Tạo Page từ danh sách (vì repository trả về List thay vì Page).
     */
    private <T> Page<T> createPage(List<T> content, long totalElements, int page, int size) {
        return new PageImpl<>(content, PageRequest.of(page, size), totalElements);
    }
}
