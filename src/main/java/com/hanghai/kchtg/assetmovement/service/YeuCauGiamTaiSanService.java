package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.NguyenNhanGiam;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauGiamTaiSan;
import com.hanghai.kchtg.assetmovement.repository.YeuCauGiamTaiSanRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class YeuCauGiamTaiSanService {
    private final YeuCauGiamTaiSanRepository repository;

    @Transactional
    public YeuCauGiamTaiSanResponse create(YeuCauGiamTaiSanRequest request) {
        YeuCauGiamTaiSan entity = YeuCauGiamTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .nguyenNhanGiam(parseNguyenNhanGiam(request.getNguyenNhanGiam()))
                .ngayGiam(Instant.now())
                .moTa(request.getLyDo())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        YeuCauGiamTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    public YeuCauGiamTaiSanResponse getById(UUID id) {
        YeuCauGiamTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("YeuCauGiamTaiSan not found: " + id));
        return toResponse(entity);
    }

    public Page<YeuCauGiamTaiSanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<YeuCauGiamTaiSanResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        if (taiSanId == null) return findAll(pageable);
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    @Transactional
    public YeuCauGiamTaiSanResponse update(UUID id, YeuCauGiamTaiSanRequest request) {
        YeuCauGiamTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("YeuCauGiamTaiSan not found: " + id));
        if (request.getLyDo() != null) entity.setMoTa(request.getLyDo());
        YeuCauGiamTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("YeuCauGiamTaiSan not found: " + id);
        repository.deleteById(id);
    }

    private YeuCauGiamTaiSanResponse toResponse(YeuCauGiamTaiSan entity) {
        return YeuCauGiamTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(null)
                .soLuong(0)
                .donViTinh(null)
                .lyDo(entity.getMoTa())
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .nguyenNhanGiam(entity.getNguyenNhanGiam() != null ? entity.getNguyenNhanGiam().name() : null)
                .createdBy(entity.getCreatedBy())
                .createdByName(null)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private NguyenNhanGiam parseNguyenNhanGiam(String value) {
        if (value == null) return null;
        try {
            return NguyenNhanGiam.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
