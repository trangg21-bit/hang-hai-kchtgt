package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.KhaiThacTaiSan;
import com.hanghai.kchtg.assetmovement.repository.KhaiThacTaiSanRepository;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository;
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
    private final TaiSanKCHTRepository taiSanRepository;

    @Transactional
    public KhaiThacTaiSanResponse create(KhaiThacTaiSanRequest request) {
        validateRequest(request);

        KhaiThacTaiSan entity = KhaiThacTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .thoiGianHoatDong(24) // Default fallback
                .mucDoKhaiThac(BigDecimal.valueOf(100.0))
                .chiPhiVanHanh(request.getDoanhThu()) // map doanhThu -> chiPhiVanHanh
                .chiPhiBaoDuong(request.getHaoMon())   // map haoMon -> chiPhiBaoDuong
                .tinhTrangKyThuat("Bình thường")
                .thangKhaiThac(LocalDateTime.now().getMonthValue())
                .namKhaiThac(request.getNamKhaiThac())
                .moTa(request.getMoTa())
                .deleted(false)
                .build();

        KhaiThacTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    public KhaiThacTaiSanResponse getById(UUID id) {
        KhaiThacTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin khai thác tài sản với id: " + id));
        return toResponse(entity);
    }

    public Page<KhaiThacTaiSanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<KhaiThacTaiSanResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        if (taiSanId == null) {
            throw new IllegalArgumentException("taiSanId không được để trống");
        }
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    public Page<KhaiThacTaiSanResponse> findByNamKhaiThac(Integer namKhaiThac, Pageable pageable) {
        if (namKhaiThac == null) {
            throw new IllegalArgumentException("namKhaiThac không được để trống");
        }
        return repository.findByNamKhaiThac(namKhaiThac, pageable).map(this::toResponse);
    }

    public Page<KhaiThacTaiSanResponse> findByTaiSanIdAndNamKhaiThac(UUID taiSanId, Integer namKhaiThac, Pageable pageable) {
        if (taiSanId == null || namKhaiThac == null) {
            throw new IllegalArgumentException("Cả taiSanId và namKhaiThac phải được cung cấp");
        }
        return repository.findByTaiSanIdAndNamKhaiThac(taiSanId, namKhaiThac, pageable).map(this::toResponse);
    }

    @Transactional
    public KhaiThacTaiSanResponse update(UUID id, KhaiThacTaiSanRequest request) {
        KhaiThacTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin khai thác tài sản với id: " + id));

        if (request.getTaiSanId() != null) {
            entity.setTaiSanId(request.getTaiSanId());
        }
        if (request.getNamKhaiThac() != null) {
            entity.setNamKhaiThac(request.getNamKhaiThac());
        }
        if (request.getDoanhThu() != null) {
            entity.setChiPhiVanHanh(request.getDoanhThu());
        }
        if (request.getHaoMon() != null) {
            entity.setChiPhiBaoDuong(request.getHaoMon());
        }
        if (request.getMoTa() != null) {
            entity.setMoTa(request.getMoTa());
        }

        KhaiThacTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        KhaiThacTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin khai thác tài sản với id: " + id));
        entity.setDeleted(true);
        repository.save(entity);
    }

    public BigDecimal calculateHaoMon(UUID taiSanId) {
        KhaiThacTaiSan entity = repository.findByTaiSanId(taiSanId).stream()
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông tin khai thác tài sản cho taiSanId: " + taiSanId));
        return entity.getChiPhiVanHanh() != null
                ? entity.getChiPhiVanHanh()
                : BigDecimal.ZERO;
    }

    private void validateRequest(KhaiThacTaiSanRequest request) {
        if (request.getTaiSanId() == null) {
            throw new IllegalArgumentException("taiSanId không được để trống");
        }
        if (request.getNamKhaiThac() == null) {
            throw new IllegalArgumentException("namKhaiThac không được để trống");
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private KhaiThacTaiSanResponse toResponse(KhaiThacTaiSan entity) {
        String tenTaiSan = null;
        if (entity.getTaiSanId() != null) {
            var taiSanOpt = taiSanRepository.findById(entity.getTaiSanId());
            if (taiSanOpt.isPresent()) {
                tenTaiSan = taiSanOpt.get().getTenTaiSan();
            }
        }

        return KhaiThacTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(tenTaiSan)
                .namKhaiThac(entity.getNamKhaiThac())
                .doanhThu(entity.getChiPhiVanHanh())
                .haoMon(entity.getChiPhiBaoDuong())
                .moTa(entity.getMoTa())
                .createdBy(entity.getCreatedBy())
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }
}
