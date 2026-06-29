package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetRequest;
import com.hanghai.kchtg.assetmovement.dto.LuuPheDuyetResponse;
import com.hanghai.kchtg.assetmovement.entity.KetQuaPheDuyet;
import com.hanghai.kchtg.assetmovement.entity.LuuPheDuyet;
import com.hanghai.kchtg.assetmovement.repository.LuuPheDuyetRepository;
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
public class LuuPheDuyetService {

    private final LuuPheDuyetRepository repository;

    @Transactional
    public LuuPheDuyetResponse create(LuuPheDuyetRequest request) {
        validateRequest(request);

        KetQuaPheDuyet ketQua;
        try {
            ketQua = KetQuaPheDuyet.valueOf(request.getKetQua());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid ketQua: " + request.getKetQua());
        }

        LuuPheDuyet entity = LuuPheDuyet.builder()
                .yeuCauId(request.getYeuCauId())
                .capPheDuyet(1)
                .nguoiPheDuyet(null)
                .ketQua(ketQua)
                .lyDo(request.getGhiChu())
                .ngayPheDuyet(Instant.now())
                .moTa(request.getGhiChu())
                .deleted(false)
                .build();

        LuuPheDuyet saved = repository.save(entity);
        return toResponse(saved);
    }

    public LuuPheDuyetResponse getById(UUID id) {
        LuuPheDuyet entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LuuPheDuyet not found with id: " + id));
        return toResponse(entity);
    }

    public Page<LuuPheDuyetResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<LuuPheDuyetResponse> findByYeuCauId(UUID yeuCauId, Pageable pageable) {
        if (yeuCauId == null) {
            throw new IllegalArgumentException("yeuCauId must not be null");
        }
        return repository.findByYeuCauId(yeuCauId, pageable).map(this::toResponse);
    }

    public Page<LuuPheDuyetResponse> findByKetQua(KetQuaPheDuyet ketQua, Pageable pageable) {
        return repository.findByKetQua(ketQua, pageable).map(this::toResponse);
    }

    public Page<LuuPheDuyetResponse> findByYeuCauIdAndKetQua(UUID yeuCauId, KetQuaPheDuyet ketQua, Pageable pageable) {
        if (yeuCauId == null) {
            throw new IllegalArgumentException("yeuCauId must not be null");
        }
        return repository.findByYeuCauIdAndKetQua(yeuCauId, ketQua, pageable).map(this::toResponse);
    }

    @Transactional
    public LuuPheDuyetResponse update(UUID id, LuuPheDuyetRequest request) {
        LuuPheDuyet entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LuuPheDuyet not found with id: " + id));

        if (request.getKetQua() != null && !request.getKetQua().isBlank()) {
            try {
                entity.setKetQua(KetQuaPheDuyet.valueOf(request.getKetQua()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid ketQua: " + request.getKetQua());
            }
        }
        if (request.getGhiChu() != null) {
            entity.setMoTa(request.getGhiChu());
        }

        LuuPheDuyet saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("LuuPheDuyet not found with id: " + id);
        }
        repository.deleteById(id);
    }

    private void validateRequest(LuuPheDuyetRequest request) {
        if (request.getYeuCauId() == null) {
            throw new IllegalArgumentException("yeuCauId must not be null");
        }
        if (request.getKetQua() == null || request.getKetQua().isBlank()) {
            throw new IllegalArgumentException("ketQua must not be blank");
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private LuuPheDuyetResponse toResponse(LuuPheDuyet entity) {
        return LuuPheDuyetResponse.builder()
                .id(entity.getId())
                .yeuCauId(entity.getYeuCauId())
                .loaiYeuCau(null)
                .ketQua(entity.getKetQua() != null ? entity.getKetQua().name() : null)
                .nguoiPheDuyet(entity.getNguoiPheDuyet() != null ? entity.getNguoiPheDuyet().toString() : null)
                .ghiChu(entity.getMoTa())
                .createdBy(entity.getCreatedBy())
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }
}
