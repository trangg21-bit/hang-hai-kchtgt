package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauTangTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiTaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiTaiSan;
import com.hanghai.kchtg.assetmovement.entity.YeuCauTangTaiSan;
import com.hanghai.kchtg.assetmovement.repository.YeuCauTangTaiSanRepository;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final TaiSanKCHTRepository taiSanRepository;
    private final UserRepository userRepository;

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName())
                    .map(com.hanghai.kchtg.user.entity.User::getId)
                    .orElse(null);
        }
        return null;
    }

    @Transactional
    public YeuCauTangTaiSanResponse create(YeuCauTangTaiSanRequest request) {
        UUID currentUserId = getCurrentUserId();
        YeuCauTangTaiSan entity = YeuCauTangTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .loaiTaiSan(null)
                .moTa(request.getLyDo())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
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
        entity.setUpdatedBy(getCurrentUserId());

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

    @Transactional
    public YeuCauTangTaiSanResponse approve(UUID id, String remarks) {
        YeuCauTangTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu tăng tài sản với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setTrangThai(TrangThaiYeuCau.DA_PHE_DUYET);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        entity.setUpdatedBy(currentUserId);

        if (entity.getTaiSanId() != null) {
            taiSanRepository.findById(entity.getTaiSanId()).ifPresent(taiSan -> {
                taiSan.setTrangThai(TrangThaiTaiSan.DANG_QUAN_LY);
                taiSan.setApprovedBy(currentUserId);
                taiSan.setApprovedAt(Instant.now());
                taiSanRepository.save(taiSan);
            });
        }

        YeuCauTangTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public YeuCauTangTaiSanResponse reject(UUID id, String remarks) {
        YeuCauTangTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu tăng tài sản với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setTrangThai(TrangThaiYeuCau.TU_CHOI);
        entity.setUnapprovedBy(currentUserId);
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        entity.setUpdatedBy(currentUserId);

        YeuCauTangTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private YeuCauTangTaiSanResponse toResponse(YeuCauTangTaiSan entity) {
        String tenTaiSan = null;
        String maSoTang = null;
        String donViTinh = "Cái";

        if (entity.getTaiSanId() != null) {
            var taiSanOpt = taiSanRepository.findById(entity.getTaiSanId());
            if (taiSanOpt.isPresent()) {
                tenTaiSan = taiSanOpt.get().getTenTaiSan();
                maSoTang = taiSanOpt.get().getMaTaiSan();
            }
        }

        String createdByName = null;
        if (entity.getCreatedBy() != null) {
            var userOpt = userRepository.findById(entity.getCreatedBy());
            if (userOpt.isPresent()) {
                createdByName = userOpt.get().getFullName();
                if (createdByName == null || createdByName.isEmpty()) {
                    createdByName = userOpt.get().getUsername();
                }
            }
        }

        return YeuCauTangTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(tenTaiSan)
                .soLuong(1)
                .donViTinh(donViTinh)
                .lyDo(entity.getMoTa())
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .maSoTang(maSoTang)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }
}

