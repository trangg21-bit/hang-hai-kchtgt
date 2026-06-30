package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiTaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauTangTaiSan;
import com.hanghai.kchtg.assetmovement.repository.YeuCauTangTaiSanRepository;
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
public class YeuCauTangTaiSanService {

    private final YeuCauTangTaiSanRepository repository;

    @Transactional
    public YeuCauTangTaiSanResponse create(YeuCauTangTaiSanRequest request) {
        YeuCauTangTaiSan entity = YeuCauTangTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .loaiTaiSan(null)
                .moTa(request.getLyDo())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        YeuCauTangTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    public YeuCauTangTaiSanResponse getById(UUID id) {
        YeuCauTangTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu tăng tài sản với id: " + id));
        return toResponse(entity);
    }

    public Page<YeuCauTangTaiSanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<YeuCauTangTaiSanResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    @Transactional
    public YeuCauTangTaiSanResponse update(UUID id, YeuCauTangTaiSanRequest request) {
        YeuCauTangTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu tăng tài sản với id: " + id));

        if (request.getTaiSanId() != null) {
            entity.setTaiSanId(request.getTaiSanId());
        }
        if (request.getLyDo() != null) {
            entity.setMoTa(request.getLyDo());
        }

        YeuCauTangTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy yêu cầu tăng tài sản với id: " + id);
        }
        repository.deleteById(id);
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private YeuCauTangTaiSanResponse toResponse(YeuCauTangTaiSan entity) {
        return YeuCauTangTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(null)
                .soLuong(0)
                .donViTinh(null)
                .lyDo(entity.getMoTa())
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .maSoTang(null)
                .createdBy(entity.getCreatedBy())
                .createdByName(null)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }
}
