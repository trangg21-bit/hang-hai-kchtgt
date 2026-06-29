package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKCHTResponse;
import com.hanghai.kchtg.assetmovement.entity.TaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiTaiSan;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository;
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
public class TaiSanKCHTService {
    private final TaiSanKCHTRepository repository;

    @Transactional
    public TaiSanKCHTResponse create(TaiSanKCHTRequest request) {
        TaiSanKCHT entity = TaiSanKCHT.builder()
                .maTaiSan(request.getMaTaiSan())
                .tenTaiSan(request.getTenTaiSan())
                .loaiTaiSan(null)
                .viTri(request.getViTri())
                .thongSoKyThuat(request.getThongSoKyThuat())
                .nguonKinhPhi(request.getNguonKinhPhi())
                .nguyenGia(request.getNguyenGia())
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .deleted(false)
                .build();
        TaiSanKCHT saved = repository.save(entity);
        return toResponse(saved);
    }

    public TaiSanKCHTResponse getById(UUID id) {
        TaiSanKCHT entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TaiSanKCHT not found: " + id));
        return toResponse(entity);
    }

    public Page<TaiSanKCHTResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public TaiSanKCHTResponse update(UUID id, TaiSanKCHTRequest request) {
        TaiSanKCHT entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TaiSanKCHT not found: " + id));
        if (request.getTenTaiSan() != null) entity.setTenTaiSan(request.getTenTaiSan());
        if (request.getViTri() != null) entity.setViTri(request.getViTri());
        TaiSanKCHT saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("TaiSanKCHT not found: " + id);
        repository.deleteById(id);
    }

    public Page<TaiSanKCHTResponse> findByMaTaiSan(String maTaiSan, Pageable pageable) {
        if (maTaiSan == null) return findAll(pageable);
        return repository.findByMaTaiSan(maTaiSan, pageable).map(this::toResponse);
    }

    public long countByStatus(String status) {
        return repository.countByTrangThai(status);
    }

    private TaiSanKCHTResponse toResponse(TaiSanKCHT entity) {
        return TaiSanKCHTResponse.builder()
                .id(entity.getId())
                .maTaiSan(entity.getMaTaiSan())
                .tenTaiSan(entity.getTenTaiSan())
                .loaiTaiSan(entity.getLoaiTaiSan() != null ? entity.getLoaiTaiSan().name() : null)
                .viTri(entity.getViTri())
                .thongSoKyThuat(entity.getThongSoKyThuat())
                .nguonKinhPhi(entity.getNguonKinhPhi())
                .nguyenGia(entity.getNguyenGia())
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
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
}
