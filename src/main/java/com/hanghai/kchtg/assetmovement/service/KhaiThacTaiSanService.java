package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.KhaiThacTaiSan;
import com.hanghai.kchtg.assetmovement.repository.KhaiThacTaiSanRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KhaiThacTaiSanService {

    private final KhaiThacTaiSanRepository repository;

    @Transactional
    public KhaiThacTaiSanResponse create(KhaiThacTaiSanRequest request) {
        validateRequest(request);

        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .thoiGianHoatDong(null)
                .mucDoKhaiThac(null)
                .chiPhiVanHanh(null)
                .chiPhiBaoDuong(null)
                .tinhTrangKyThuat(null)
                .thangKhaiThac(null)
                .namKhaiThac(request.getNamKhaiThac())
                .moTa(request.getMoTa())
                .deleted(false)
                .build();

        KhaiThacTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    public KhaiThacTaiSanResponse getById(UUID id) {
        KhaiThacTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("KhaiThacTaiSan not found with id: " + id));
        return toResponse(entity);
    }

    public Page<KhaiThacTaiSanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<KhaiThacTaiSanResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        if (taiSanId == null) {
            throw new IllegalArgumentException("taiSanId must not be null");
        }
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    public Page<KhaiThacTaiSanResponse> findByNamKhaiThac(Integer namKhaiThac, Pageable pageable) {
        if (namKhaiThac == null) {
            throw new IllegalArgumentException("namKhaiThac must not be null");
        }
        return repository.findByNamKhaiThac(namKhaiThac, pageable).map(this::toResponse);
    }

    public Page<KhaiThacTaiSanResponse> findByTaiSanIdAndNamKhaiThac(UUID taiSanId, Integer namKhaiThac, Pageable pageable) {
        if (taiSanId == null || namKhaiThac == null) {
            throw new IllegalArgumentException("Both taiSanId and namKhaiThac must be provided");
        }
        return repository.findByTaiSanIdAndNamKhaiThac(taiSanId, namKhaiThac, pageable).map(this::toResponse);
    }

    @Transactional
    public KhaiThacTaiSanResponse update(UUID id, KhaiThacTaiSanRequest request) {
        KhaiThacTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("KhaiThacTaiSan not found with id: " + id));

        if (request.getTaiSanId() != null) {
            entity.setTaiSanId(request.getTaiSanId());
        }
        if (request.getTenTaiSan() != null) {
            entity.setMoTa(request.getTenTaiSan());
        }
        if (request.getNamKhaiThac() != null) {
            entity.setNamKhaiThac(request.getNamKhaiThac());
        }
        if (request.getMoTa() != null) {
            entity.setMoTa(request.getMoTa());
        }

        KhaiThacTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("KhaiThacTaiSan not found with id: " + id);
        }
        repository.deleteById(id);
    }

    public BigDecimal calculateHaoMon(UUID taiSanId) {
        KhaiThacTaiSan entity = repository.findByTaiSanId(taiSanId).stream()
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("KhaiThacTaiSan not found for taiSanId: " + taiSanId));
        return entity.getChiPhiVanHanh() != null
                ? entity.getChiPhiVanHanh()
                : BigDecimal.ZERO;
    }

    private void validateRequest(KhaiThacTaiSanRequest request) {
        if (request.getTaiSanId() == null) {
            throw new IllegalArgumentException("taiSanId must not be null");
        }
        if (request.getNamKhaiThac() == null) {
            throw new IllegalArgumentException("namKhaiThac must not be null");
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private KhaiThacTaiSanResponse toResponse(KhaiThacTaiSan entity) {
        return KhaiThacTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(entity.getMoTa())
                .namKhaiThac(entity.getNamKhaiThac())
                .doanhThu(null)
                .haoMon(null)
                .moTa(entity.getMoTa())
                .createdBy(entity.getCreatedBy())
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }
}
