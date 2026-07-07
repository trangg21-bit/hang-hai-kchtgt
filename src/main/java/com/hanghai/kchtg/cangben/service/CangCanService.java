package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.cangcan.*;
import com.hanghai.kchtg.cangben.entity.CangCan;
import com.hanghai.kchtg.cangben.repository.CangCanRepository;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service core for CangCan (inland port) CRUD operations.
 * Covers F-026 (create), F-027 (update), F-028 (soft-delete), F-029 (list).
 * <p>
 * Business rules:
 * - Code (maCangCan) is immutable after creation — duplicate detection on create
 * - Approval status always set to CHO_PHE_DUYET on create/update
 * - No parent FK guard (CangCan is independent)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CangCanService {

    private final CangCanRepository cangCanRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final AuditLogService auditLogService;

    @Transactional
    public CangCanResponse create(CreateCangCanRequest request) {
        if (cangCanRepository.existsByMaCangCan(request.getMaCangCan())) {
            throw new IllegalArgumentException("Mã " + request.getMaCangCan() + " đã tồn tại");
        }
        CangCan entity = CangCan.builder()
                .maCangCan(request.getMaCangCan()).tenCangCan(request.getTenCangCan())
                .tinhThanhPho(request.getTinhThanhPho()).viDo(request.getViDo())
                .kinhDo(request.getKinhDo()).dienTich(request.getDienTich())
                .congSuatTEU(request.getCongSuatTEU()).trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet("CHO_PHE_DUYET").build();
        CangCan saved = cangCanRepository.save(entity);
        log.info("Created CangCan [{}] code={}", saved.getId(), saved.getMaCangCan());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CangCanResponse getById(UUID id) {
        return toResponse(cangCanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<CangCanResponse> findAll(int page, int size, UUID orgUnitId) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        return cangCanRepository.findAllActive(orgUnitId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CangCanResponse findByCode(String maCangCan) {
        return toResponse(cangCanRepository.findByMaCangCan(maCangCan)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với mã: " + maCangCan)));
    }

    @Transactional
    public CangCanResponse update(UpdateCangCanRequest request) {
        CangCan entity = cangCanRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + request.getId()));

        // Capture pre-mutation snapshot BEFORE applying changes (INT-003c fix)
        CangCan snapshot = CangCan.builder()
                .tenCangCan(entity.getTenCangCan()).tinhThanhPho(entity.getTinhThanhPho())
                .viDo(entity.getViDo()).kinhDo(entity.getKinhDo()).dienTich(entity.getDienTich())
                .congSuatTEU(entity.getCongSuatTEU()).trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .build();

        if (request.getTenCangCan() != null) entity.setTenCangCan(request.getTenCangCan());
        if (request.getTinhThanhPho() != null) entity.setTinhThanhPho(request.getTinhThanhPho());
        if (request.getViDo() != null) entity.setViDo(request.getViDo());
        if (request.getKinhDo() != null) entity.setKinhDo(request.getKinhDo());
        if (request.getDienTich() != null) entity.setDienTich(request.getDienTich());
        if (request.getCongSuatTEU() != null) entity.setCongSuatTEU(request.getCongSuatTEU());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());

        // Reset approval status — changes require re-approval
        entity.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        CangCan saved = cangCanRepository.save(entity);

        // Record change history using pre-mutation snapshot (INT-003b/c)
        lichSuThayDoiService.recordChanges("CangCan", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated CangCan [{}] code={}", saved.getId(), saved.getMaCangCan());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        CangCan entity = cangCanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));
        entity.softDelete();
        cangCanRepository.save(entity);
        log.info("Soft-deleted CangCan [{}] code={}", entity.getId(), entity.getMaCangCan());
    }

    private CangCanResponse toResponse(CangCan e) {
        return CangCanResponse.builder()
                .id(e.getId()).maCangCan(e.getMaCangCan()).tenCangCan(e.getTenCangCan())
                .tinhThanhPho(e.getTinhThanhPho()).viDo(e.getViDo()).kinhDo(e.getKinhDo())
                .dienTich(e.getDienTich()).congSuatTEU(e.getCongSuatTEU())
                .trangThaiHoatDong(e.getTrangThaiHoatDong()).trangThaiPheDuyet(e.getTrangThaiPheDuyet())
                .orgUnitId(e.getOrgUnitId()).createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
