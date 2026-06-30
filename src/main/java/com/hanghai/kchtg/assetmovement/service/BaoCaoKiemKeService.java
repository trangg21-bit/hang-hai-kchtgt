package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.BaoCaoKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiBaoCao;
import com.hanghai.kchtg.assetmovement.repository.BaoCaoKiemKeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BaoCaoKiemKeService {
    private final BaoCaoKiemKeRepository repository;

    @Transactional
    public BaoCaoKiemKeResponse create(BaoCaoKiemKeRequest request) {
        BaoCaoKiemKe entity = BaoCaoKiemKe.builder()
                .keHoachId(request.getKeHoachId())
                .tongSoTaiSan(request.getTongSoLuong())
                .soThua(request.getSoLuongChenhLech() > 0 ? request.getSoLuongChenhLech() : 0)
                .soThieu(request.getSoLuongChenhLech() < 0 ? -request.getSoLuongChenhLech() : 0)
                .moTa(request.getMoTa())
                .trangThai(TrangThaiBaoCao.DA_PHE_DUYET)
                .deleted(false)
                .build();
        BaoCaoKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    public BaoCaoKiemKeResponse getById(UUID id) {
        BaoCaoKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id));
        return toResponse(entity);
    }

    public Page<BaoCaoKiemKeResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<BaoCaoKiemKeResponse> findByKeHoachId(UUID keHoachId, Pageable pageable) {
        if (keHoachId == null) return findAll(pageable);
        return repository.findByKeHoachId(keHoachId, pageable).map(this::toResponse);
    }

    @Transactional
    public BaoCaoKiemKeResponse update(UUID id, BaoCaoKiemKeRequest request) {
        BaoCaoKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id));
        if (request.getMoTa() != null) entity.setMoTa(request.getMoTa());
        BaoCaoKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id);
        repository.deleteById(id);
    }

    private BaoCaoKiemKeResponse toResponse(BaoCaoKiemKe entity) {
        return BaoCaoKiemKeResponse.builder()
                .id(entity.getId())
                .keHoachId(entity.getKeHoachId())
                .tenBaoCao(null)
                .tongSoLuong(entity.getTongSoTaiSan() != null ? entity.getTongSoTaiSan() : 0)
                .soLuongChenhLech(entity.getSoThua() != null ? entity.getSoThua() - entity.getSoThieu() : 0)
                .ketQua(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .moTa(entity.getMoTa())
                .createdBy(entity.getCreatedBy())
                .createdByName(null)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }

    private java.time.LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
