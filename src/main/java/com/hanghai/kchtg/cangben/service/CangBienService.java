package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.cangbien.*;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service core for CangBien CRUD operations.
 * Covers F-008 (create), F-009 (update), F-010 (soft-delete).
 * <p>
 * Business rules:
 * - Code (maCang) is immutable after creation — duplicate detection on create
 * - Approval status always set to CHO_PHE_DUYET on create/update
 * - Cannot soft-delete if active children (BenCang, VungNuoc) exist
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CangBienService {

    private final CangBienRepository cangBienRepository;
    private final BenCangRepository benCangRepository;
    private final VungNuocRepository vungNuocRepository;
    private final LichSuThayDoiService lichSuThayDoiService;

    // ── CREATE (F-008) ──────────────────────────────────────────────────

    /**
     * Create a new CangBien. Returns 409 if code already exists.
     */
    @Transactional
    public CangBienResponse create(CreateCangBienRequest request) {
        if (cangBienRepository.existsByMaCang(request.getMaCang())) {
            throw new IllegalArgumentException("Mã " + request.getMaCang() + " đã tồn tại");
        }

        CangBien entity = CangBien.builder()
                .maCang(request.getMaCang())
                .tenCang(request.getTenCang())
                .tinhThanhPho(request.getTinhThanhPho())
                .viDo(request.getViDo())
                .kinhDo(request.getKinhDo())
                .dienTich(request.getDienTich())
                .khaNangTiepNhan(request.getKhaNangTiepNhan())
                .trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();

        CangBien saved = cangBienRepository.save(entity);
        log.info("Created CangBien [{}] code={}", saved.getId(), saved.getMaCang());
        return toResponse(saved);
    }

    // ── READ ─────────────────────────────────────────────────────────────

    /**
     * Find a CangBien by ID.
     */
    @Transactional(readOnly = true)
    public CangBienResponse getById(UUID id) {
        CangBien entity = cangBienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
        return toResponse(entity);
    }

    /**
     * Paginated list with optional org-unit filter.
     * Default page size 20, max 100.
     */
    @Transactional(readOnly = true)
    public Page<CangBienResponse> findAll(int page, int size, UUID orgUnitId) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());

        Page<CangBien> results = cangBienRepository.findAllActive(orgUnitId, pageable);
        return results.map(this::toResponse);
    }

    // ── UPDATE (F-009) ──────────────────────────────────────────────────

    /**
     * Update a CangBien. Code is immutable. Resets approval to CHO_PHE_DUYET.
     * Captures a pre-mutation snapshot for change history (INT-003c).
     */
    @Transactional
    public CangBienResponse update(UpdateCangBienRequest request) {
        CangBien entity = cangBienRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + request.getId()));

        // Capture pre-mutation snapshot before applying changes (INT-003c)
        String oldTenCang = entity.getTenCang();
        String oldTinhThanhPho = entity.getTinhThanhPho();
        BigDecimal oldViDo = entity.getViDo();
        BigDecimal oldKinhDo = entity.getKinhDo();
        BigDecimal oldDienTich = entity.getDienTich();
        BigDecimal oldKhaNangTiepNhan = entity.getKhaNangTiepNhan();
        String oldTrangThaiHoatDong = entity.getTrangThaiHoatDong();

        // Update mutable fields — code (maCang) is immutable
        if (request.getTenCang() != null) entity.setTenCang(request.getTenCang());
        if (request.getTinhThanhPho() != null) entity.setTinhThanhPho(request.getTinhThanhPho());
        if (request.getViDo() != null) entity.setViDo(request.getViDo());
        if (request.getKinhDo() != null) entity.setKinhDo(request.getKinhDo());
        if (request.getDienTich() != null) entity.setDienTich(request.getDienTich());
        if (request.getKhaNangTiepNhan() != null) entity.setKhaNangTiepNhan(request.getKhaNangTiepNhan());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());

        // Reset approval status — changes require re-approval
        entity.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        CangBien saved = cangBienRepository.save(entity);

        // Build detached snapshot of old state to diff against (INT-003c)
        CangBien snapshot = CangBien.builder()
                .tenCang(oldTenCang).tinhThanhPho(oldTinhThanhPho)
                .viDo(oldViDo).kinhDo(oldKinhDo).dienTich(oldDienTich)
                .khaNangTiepNhan(oldKhaNangTiepNhan).trangThaiHoatDong(oldTrangThaiHoatDong)
                .trangThaiPheDuyet(saved.getTrangThaiPheDuyet())
                .build();

        // Record field-level change history (INT-003b)
        lichSuThayDoiService.recordChanges("CangBien", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated CangBien [{}] code={}", saved.getId(), saved.getMaCang());
        return toResponse(saved);
    }

    // ── DELETE (F-010) ──────────────────────────────────────────────────

    /**
     * Soft-delete a CangBien. Returns 409 if active children exist.
     */
    @Transactional
    public void softDelete(UUID id) {
        CangBien entity = cangBienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        // Guard: cannot soft-delete if children exist
        long benCangCount = countBenCangByCangBienId(id);
        long vungNuocCount = countVungNuocByCangBienId(id);

        if (benCangCount > 0 || vungNuocCount > 0) {
            StringBuilder msg = new StringBuilder("Không thể xóa: còn ");
            if (benCangCount > 0) msg.append(benCangCount).append(" bến cảng đang hoạt động");
            if (benCangCount > 0 && vungNuocCount > 0) msg.append(", ");
            if (vungNuocCount > 0) msg.append(vungNuocCount).append(" vùng nước đang hoạt động");
            throw new IllegalArgumentException(msg.toString());
        }

        entity.softDelete();
        cangBienRepository.save(entity);
        log.info("Soft-deleted CangBien [{}] code={}", entity.getId(), entity.getMaCang());
    }

    // ── Count helpers (would need their own repos — stubs for now) ──────

    private long countBenCangByCangBienId(UUID cangBienId) {
        return benCangRepository.countByCangBienIdAndDeletedAtIsNull(cangBienId);
    }

    private long countVungNuocByCangBienId(UUID cangBienId) {
        return vungNuocRepository.countByCangBienIdAndDeletedAtIsNull(cangBienId);
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    private CangBienResponse toResponse(CangBien entity) {
        return CangBienResponse.builder()
                .id(entity.getId())
                .maCang(entity.getMaCang())
                .tenCang(entity.getTenCang())
                .tinhThanhPho(entity.getTinhThanhPho())
                .viDo(entity.getViDo())
                .kinhDo(entity.getKinhDo())
                .dienTich(entity.getDienTich())
                .khaNangTiepNhan(entity.getKhaNangTiepNhan())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .orgUnitId(entity.getOrgUnitId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
