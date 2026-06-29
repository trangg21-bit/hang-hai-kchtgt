package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.HoSoXuLyTaiSan;
import com.hanghai.kchtg.assetmovement.entity.LoaiXuLy;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiHoSoXuLy;
import com.hanghai.kchtg.assetmovement.repository.HoSoXuLyTaiSanRepository;
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
public class HoSoXuLyTaiSanService {
    private final HoSoXuLyTaiSanRepository repository;

    @Transactional
    public HoSoXuLyTaiSanResponse create(HoSoXuLyTaiSanRequest request) {
        HoSoXuLyTaiSan entity = HoSoXuLyTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .loaiXuLy(parseLoaiXuLy(request.getLoaiXuLy()))
                .moTa(request.getMoTa())
                .trangThai(TrangThaiHoSoXuLy.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        HoSoXuLyTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    public HoSoXuLyTaiSanResponse getById(UUID id) {
        HoSoXuLyTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("HoSoXuLyTaiSan not found: " + id));
        return toResponse(entity);
    }

    public Page<HoSoXuLyTaiSanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<HoSoXuLyTaiSanResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        if (taiSanId == null) return findAll(pageable);
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    public Page<HoSoXuLyTaiSanResponse> findByLoaiXuLy(LoaiXuLy loaiXuLy, Pageable pageable) {
        if (loaiXuLy == null) return findAll(pageable);
        return repository.findByLoaiXuLy(loaiXuLy, pageable).map(this::toResponse);
    }

    public Page<HoSoXuLyTaiSanResponse> findByTaiSanIdAndLoaiXuLy(UUID taiSanId, LoaiXuLy loaiXuLy, Pageable pageable) {
        return repository.findByTaiSanIdAndLoaiXuLy(taiSanId, loaiXuLy, pageable).map(this::toResponse);
    }

    @Transactional
    public HoSoXuLyTaiSanResponse update(UUID id, HoSoXuLyTaiSanRequest request) {
        HoSoXuLyTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("HoSoXuLyTaiSan not found: " + id));
        if (request.getLoaiXuLy() != null) entity.setLoaiXuLy(parseLoaiXuLy(request.getLoaiXuLy()));
        if (request.getMoTa() != null) entity.setMoTa(request.getMoTa());
        HoSoXuLyTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("HoSoXuLyTaiSan not found: " + id);
        repository.deleteById(id);
    }

    private HoSoXuLyTaiSanResponse toResponse(HoSoXuLyTaiSan entity) {
        return HoSoXuLyTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(null)
                .loaiXuLy(entity.getLoaiXuLy() != null ? entity.getLoaiXuLy().name() : null)
                .moTa(entity.getMoTa())
                .trangThaiHoSo(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .createdBy(entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : null)
                .createdByName(null)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private LoaiXuLy parseLoaiXuLy(String value) {
        if (value == null) return null;
        try {
            return LoaiXuLy.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
