package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.KeHoachKiemKe;
import com.hanghai.kchtg.assetmovement.entity.LoaiKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKeHoach;
import com.hanghai.kchtg.assetmovement.repository.KeHoachKiemKeRepository;
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
public class KeHoachKiemKeService {
    private final KeHoachKiemKeRepository repository;

    @Transactional
    public KeHoachKiemKeResponse create(KeHoachKiemKeRequest request) {
        KeHoachKiemKe entity = KeHoachKiemKe.builder()
                .loaiKiemKe(request.getLoaiKiemKe())
                .phamVi(request.getPhamVi())
                .ngayBatDau(request.getNgayBatDau())
                .ngayKetThuc(request.getNgayKetThuc())
                .toTruongKiemKe(request.getToTruongKiemKe())
                .moTa(request.getMoTa())
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    public KeHoachKiemKeResponse getById(UUID id) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        return toResponse(entity);
    }

    public Page<KeHoachKiemKeResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<KeHoachKiemKeResponse> findByTrangThai(TrangThaiKeHoach trangThai, Pageable pageable) {
        if (trangThai == null) return findAll(pageable);
        return repository.findByTrangThai(trangThai, pageable).map(this::toResponse);
    }

    @Transactional
    public KeHoachKiemKeResponse update(UUID id, KeHoachKiemKeRequest request) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        if (request.getPhamVi() != null) entity.setPhamVi(request.getPhamVi());
        if (request.getMoTa() != null) entity.setMoTa(request.getMoTa());
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id);
        repository.deleteById(id);
    }

    public long countByTrangThai(TrangThaiKeHoach trangThai) {
        return repository.countByTrangThai(trangThai);
    }

    private KeHoachKiemKeResponse toResponse(KeHoachKiemKe entity) {
        return KeHoachKiemKeResponse.builder()
                .id(entity.getId())
                .tenKeHoach(null)
                .moTa(entity.getMoTa())
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
