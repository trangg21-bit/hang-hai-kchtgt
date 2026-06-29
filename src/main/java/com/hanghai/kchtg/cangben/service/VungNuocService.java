package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.vungnuoc.*;
import com.hanghai.kchtg.cangben.entity.VungNuoc;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class VungNuocService {

    private final VungNuocRepository vungNuocRepository;
    private final LichSuThayDoiService lichSuThayDoiService;

    @Transactional
    public VungNuocResponse create(CreateVungNuocRequest request) {
        if (vungNuocRepository.existsByMaVungNuoc(request.getMaVungNuoc())) {
            throw new IllegalArgumentException("Mã " + request.getMaVungNuoc() + " đã tồn tại");
        }
        VungNuoc entity = VungNuoc.builder()
                .maVungNuoc(request.getMaVungNuoc()).tenVungNuoc(request.getTenVungNuoc())
                .cangBienId(request.getCangBienId()).dienTich(request.getDienTich())
                .doSauMax(request.getDoSauMax()).doSauTrungBinh(request.getDoSauTrungBinh())
                .loaiVungNuoc(request.getLoaiVungNuoc()).trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet("CHO_PHE_DUYET").build();
        VungNuoc saved = vungNuocRepository.save(entity);
        log.info("Created VungNuoc [{}] code={}", saved.getId(), saved.getMaVungNuoc());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public VungNuocResponse getById(UUID id) {
        return toResponse(vungNuocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<VungNuocResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null);
    }

    /**
     * List VungNuoc with optional orgUnitId and parent cangBienId filter (INT-004).
     */
    @Transactional(readOnly = true)
    public Page<VungNuocResponse> findAll(int page, int size, UUID orgUnitId, UUID cangBienId) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        return vungNuocRepository.findAllActive(orgUnitId, cangBienId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public VungNuocResponse findByCode(String maVungNuoc) {
        return toResponse(vungNuocRepository.findByMaVungNuoc(maVungNuoc)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với mã: " + maVungNuoc)));
    }

    @Transactional
    public VungNuocResponse update(UpdateVungNuocRequest request) {
        VungNuoc entity = vungNuocRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + request.getId()));

        // Capture pre-mutation snapshot (INT-003c)
        VungNuoc snapshot = VungNuoc.builder()
                .tenVungNuoc(entity.getTenVungNuoc()).cangBienId(entity.getCangBienId())
                .dienTich(entity.getDienTich()).doSauMax(entity.getDoSauMax())
                .doSauTrungBinh(entity.getDoSauTrungBinh()).loaiVungNuoc(entity.getLoaiVungNuoc())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong()).trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .build();

        if (request.getTenVungNuoc() != null) entity.setTenVungNuoc(request.getTenVungNuoc());
        if (request.getCangBienId() != null) entity.setCangBienId(request.getCangBienId());
        if (request.getDienTich() != null) entity.setDienTich(request.getDienTich());
        if (request.getDoSauMax() != null) entity.setDoSauMax(request.getDoSauMax());
        if (request.getDoSauTrungBinh() != null) entity.setDoSauTrungBinh(request.getDoSauTrungBinh());
        if (request.getLoaiVungNuoc() != null) entity.setLoaiVungNuoc(request.getLoaiVungNuoc());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        entity.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        VungNuoc saved = vungNuocRepository.save(entity);

        // Record change history (INT-003b)
        lichSuThayDoiService.recordChanges("VungNuoc", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated VungNuoc [{}] code={}", saved.getId(), saved.getMaVungNuoc());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        VungNuoc entity = vungNuocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id));
        entity.softDelete();
        vungNuocRepository.save(entity);
        log.info("Soft-deleted VungNuoc [{}] code={}", entity.getId(), entity.getMaVungNuoc());
    }

    private VungNuocResponse toResponse(VungNuoc e) {
        return VungNuocResponse.builder()
                .id(e.getId()).maVungNuoc(e.getMaVungNuoc()).tenVungNuoc(e.getTenVungNuoc())
                .cangBienId(e.getCangBienId()).dienTich(e.getDienTich())
                .doSauMax(e.getDoSauMax()).doSauTrungBinh(e.getDoSauTrungBinh())
                .loaiVungNuoc(e.getLoaiVungNuoc()).trangThaiHoatDong(e.getTrangThaiHoatDong())
                .trangThaiPheDuyet(e.getTrangThaiPheDuyet())                .orgUnitId(e.getOrgUnitId())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
