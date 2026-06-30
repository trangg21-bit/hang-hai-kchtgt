package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.TaiSanKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.TaiSanKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKiemKe;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKiemKeRepository;
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
public class TaiSanKiemKeService {
    private final TaiSanKiemKeRepository repository;

    @Transactional
    public TaiSanKiemKeResponse create(TaiSanKiemKeRequest request) {
        TaiSanKiemKe entity = TaiSanKiemKe.builder()
                .keHoachId(request.getKeHoachId())
                .taiSanId(request.getTaiSanId())
                .trangThaiKiemKe(parseTrangThaiKiemKe(request.getTrangThaiKiemKe()))
                .ghiChu(request.getMoTa())
                .deleted(false)
                .build();
        TaiSanKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    public TaiSanKiemKeResponse getById(UUID id) {
        TaiSanKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kiểm kê với id: " + id));
        return toResponse(entity);
    }

    public Page<TaiSanKiemKeResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<TaiSanKiemKeResponse> findByKeHoachId(UUID keHoachId, Pageable pageable) {
        if (keHoachId == null) return findAll(pageable);
        return repository.findByKeHoachId(keHoachId, pageable).map(this::toResponse);
    }

    public Page<TaiSanKiemKeResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        if (taiSanId == null) return findAll(pageable);
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    public Page<TaiSanKiemKeResponse> findByTrangThai(TrangThaiKiemKe trangThai, Pageable pageable) {
        if (trangThai == null) return findAll(pageable);
        return repository.findByTrangThaiKiemKe(trangThai, pageable).map(this::toResponse);
    }

    public Page<TaiSanKiemKeResponse> findByKeHoachIdAndTrangThai(UUID keHoachId, TrangThaiKiemKe trangThai, Pageable pageable) {
        return repository.findByKeHoachIdAndTrangThaiKiemKe(keHoachId, trangThai, pageable).map(this::toResponse);
    }

    @Transactional
    public TaiSanKiemKeResponse update(UUID id, TaiSanKiemKeRequest request) {
        TaiSanKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kiểm kê với id: " + id));
        if (request.getTrangThaiKiemKe() != null) entity.setTrangThaiKiemKe(parseTrangThaiKiemKe(request.getTrangThaiKiemKe()));
        if (request.getMoTa() != null) entity.setGhiChu(request.getMoTa());
        TaiSanKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy tài sản kiểm kê với id: " + id);
        repository.deleteById(id);
    }

    private TaiSanKiemKeResponse toResponse(TaiSanKiemKe entity) {
        return TaiSanKiemKeResponse.builder()
                .id(entity.getId())
                .keHoachId(entity.getKeHoachId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(null)
                .trangThaiKiemKe(entity.getTrangThaiKiemKe() != null ? entity.getTrangThaiKiemKe().name() : null)
                .soLuongKyHienTai(entity.getGiaTriSach() != null ? entity.getGiaTriSach().intValue() : 0)
                .soLuongKyThucTe(entity.getGiaTriThucTe() != null ? entity.getGiaTriThucTe().intValue() : 0)
                .moTa(entity.getGhiChu())
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

    private TrangThaiKiemKe parseTrangThaiKiemKe(String value) {
        if (value == null) return null;
        try {
            return TrangThaiKiemKe.valueOf(value);
        } catch (IllegalArgumentException e) {
            return TrangThaiKiemKe.CHUA_KIEM_KE;
        }
    }
}
