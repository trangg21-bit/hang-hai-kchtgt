package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.bencang.*;
import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
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

import java.util.List;
import java.util.UUID;

/**
 * Service core for BenCang (berth) CRUD operations.
 * Covers F-014 (create), F-015 (update), F-016 (soft-delete), F-017 (list).
 * <p>
 * Business rules:
 * - Code (maBen) is immutable after creation — duplicate detection on create
 * - Approval status always set to CHO_PHE_DUYET on create/update
 * - softDelete optional guard: parent CangBien must be hien_hanh (optional)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BenCangService {

    private final BenCangRepository benCangRepository;
    private final CangBienRepository cangBienRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final AuditLogService auditLogService;

    @Transactional
    public BenCangResponse create(CreateBenCangRequest request) {
        if (benCangRepository.existsByMaBen(request.getMaBen())) {
            throw new IllegalArgumentException("Mã " + request.getMaBen() + " đã tồn tại");
        }
        CangBien parent = cangBienRepository.findById(request.getCangBienId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getCangBienId()));

        // Guard: parent CangBien must be in hien_hanh (active) status
        if (!parent.getTrangThaiHoatDong().equals("HIEN_HANH")) {
            throw new IllegalArgumentException(
                    "Không thể tạo bến cảng: cảng biển cha phải ở trạng thái hoạt động (HIEN_HANH)");
        }

        BenCang entity = BenCang.builder()
                .maBen(request.getMaBen()).tenBen(request.getTenBen())
                .cangBienId(request.getCangBienId()).tuyenDuongThuy(request.getTuyenDuongThuy())
                .viDo(request.getViDo()).kinhDo(request.getKinhDo())
                .chieuDai(request.getChieuDai()).chieuRong(request.getChieuRong())
                .loaiBen(request.getLoaiBen()).doSauLuong(request.getDoSauLuong())
                .trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet("CHO_PHE_DUYET").build();
        BenCang saved = benCangRepository.save(entity);
        log.info("Created BenCang [{}] code={}", saved.getId(), saved.getMaBen());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BenCangResponse getById(UUID id) {
        return toResponse(benCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<BenCangResponse> findAll(int page, int size, UUID orgUnitId) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        return benCangRepository.findAllActive(orgUnitId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public BenCangResponse findByCode(String maBen) {
        return toResponse(benCangRepository.findByMaBen(maBen)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với mã: " + maBen)));
    }

    /**
     * Find all active BenCang by parent CangBien ID.
     */
    @Transactional(readOnly = true)
    public List<BenCang> findByCangBienId(UUID cangBienId) {
        return benCangRepository.findByCangBienIdAndDeletedAtIsNull(cangBienId);
    }

    @Transactional
    public BenCangResponse update(UpdateBenCangRequest request) {
        BenCang entity = benCangRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + request.getId()));

        // Capture pre-mutation snapshot BEFORE applying changes (INT-003c fix)
        BenCang snapshot = BenCang.builder()
                .tenBen(entity.getTenBen()).cangBienId(entity.getCangBienId())
                .tuyenDuongThuy(entity.getTuyenDuongThuy()).viDo(entity.getViDo())
                .kinhDo(entity.getKinhDo()).chieuDai(entity.getChieuDai())
                .chieuRong(entity.getChieuRong()).loaiBen(entity.getLoaiBen())
                .doSauLuong(entity.getDoSauLuong()).trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .build();

        if (request.getTenBen() != null) entity.setTenBen(request.getTenBen());
        if (request.getCangBienId() != null) entity.setCangBienId(request.getCangBienId());
        if (request.getTuyenDuongThuy() != null) entity.setTuyenDuongThuy(request.getTuyenDuongThuy());
        if (request.getViDo() != null) entity.setViDo(request.getViDo());
        if (request.getKinhDo() != null) entity.setKinhDo(request.getKinhDo());
        if (request.getChieuDai() != null) entity.setChieuDai(request.getChieuDai());
        if (request.getChieuRong() != null) entity.setChieuRong(request.getChieuRong());
        if (request.getLoaiBen() != null) entity.setLoaiBen(request.getLoaiBen());
        if (request.getDoSauLuong() != null) entity.setDoSauLuong(request.getDoSauLuong());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        entity.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        BenCang saved = benCangRepository.save(entity);

        // Record change history using pre-mutation snapshot (INT-003b/c)
        lichSuThayDoiService.recordChanges("BenCang", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated BenCang [{}] code={}", saved.getId(), saved.getMaBen());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        BenCang entity = benCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));
        // CauCang child check would use CauCangRepository — deferred to W3
        entity.softDelete();
        benCangRepository.save(entity);
        log.info("Soft-deleted BenCang [{}] code={}", entity.getId(), entity.getMaBen());
    }

    private BenCangResponse toResponse(BenCang e) {
        return BenCangResponse.builder()
                .id(e.getId()).maBen(e.getMaBen()).tenBen(e.getTenBen())
                .cangBienId(e.getCangBienId()).tuyenDuongThuy(e.getTuyenDuongThuy())
                .viDo(e.getViDo()).kinhDo(e.getKinhDo()).chieuDai(e.getChieuDai())
                .chieuRong(e.getChieuRong()).loaiBen(e.getLoaiBen())
                .doSauLuong(e.getDoSauLuong()).trangThaiHoatDong(e.getTrangThaiHoatDong())
                .trangThaiPheDuyet(e.getTrangThaiPheDuyet())                .orgUnitId(e.getOrgUnitId())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
