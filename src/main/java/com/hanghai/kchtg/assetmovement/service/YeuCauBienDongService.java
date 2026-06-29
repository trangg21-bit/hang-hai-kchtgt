package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauBienDongResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiBienDong;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauBienDong;
import com.hanghai.kchtg.assetmovement.repository.YeuCauBienDongRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class YeuCauBienDongService {

    private final YeuCauBienDongRepository repository;

    @Transactional
    public YeuCauBienDongResponse create(YeuCauBienDongRequest request) {
        validateRequest(request);

        LoaiBienDong loaiBienDong;
        try {
            loaiBienDong = LoaiBienDong.valueOf(request.getLoaiBienDong());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid loaiBienDong: " + request.getLoaiBienDong());
        }

        YeuCauBienDong entity = YeuCauBienDong.builder()
                .loaiBienDong(loaiBienDong)
                .tieuDe(request.getTenTaiSan())
                .moTa(request.getMoTa())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        YeuCauBienDong saved = repository.save(entity);
        return toResponse(saved);
    }

    public YeuCauBienDongResponse getById(UUID id) {
        YeuCauBienDong entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("YeuCauBienDong not found with id: " + id));
        return toResponse(entity);
    }

    public Page<YeuCauBienDongResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<YeuCauBienDongResponse> findByLoaiBienDong(LoaiBienDong loaiBienDong, Pageable pageable) {
        return repository.findByLoaiBienDong(loaiBienDong, pageable).map(this::toResponse);
    }

    public Page<YeuCauBienDongResponse> findByTrangThai(TrangThaiYeuCau trangThai, Pageable pageable) {
        return repository.findByTrangThai(trangThai, pageable).map(this::toResponse);
    }

    public Page<YeuCauBienDongResponse> findByLoaiBienDongAndTrangThai(LoaiBienDong loaiBienDong, TrangThaiYeuCau trangThai, Pageable pageable) {
        return repository.findByLoaiBienDongAndTrangThai(loaiBienDong, trangThai, pageable).map(this::toResponse);
    }

    @Transactional
    public YeuCauBienDongResponse update(UUID id, YeuCauBienDongRequest request) {
        YeuCauBienDong entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("YeuCauBienDong not found with id: " + id));

        validateRequest(request);

        if (request.getLoaiBienDong() != null) {
            try {
                entity.setLoaiBienDong(LoaiBienDong.valueOf(request.getLoaiBienDong()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid loaiBienDong: " + request.getLoaiBienDong());
            }
        }
        if (request.getTenTaiSan() != null) {
            entity.setTieuDe(request.getTenTaiSan());
        }
        if (request.getMoTa() != null) {
            entity.setMoTa(request.getMoTa());
        }

        YeuCauBienDong saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("YeuCauBienDong not found with id: " + id);
        }
        repository.deleteById(id);
    }

    private void validateRequest(YeuCauBienDongRequest request) {
        if (request.getLoaiBienDong() == null) {
            throw new IllegalArgumentException("loaiBienDong must not be null");
        }
        if (request.getTenTaiSan() == null || request.getTenTaiSan().isBlank()) {
            throw new IllegalArgumentException("tenTaiSan (tieuDe) must not be blank");
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private YeuCauBienDongResponse toResponse(YeuCauBienDong entity) {
        return YeuCauBienDongResponse.builder()
                .id(entity.getId())
                .taiSanId(null)
                .loaiBienDong(entity.getLoaiBienDong() != null ? entity.getLoaiBienDong().name() : null)
                .tenTaiSan(entity.getTieuDe())
                .soLuong(0)
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .moTa(entity.getMoTa())
                .createdBy(entity.getCreatedBy())
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }
}
