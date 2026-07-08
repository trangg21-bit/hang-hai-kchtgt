package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.NguyenNhanGiam;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiTaiSan;
import com.hanghai.kchtg.assetmovement.entity.YeuCauGiamTaiSan;
import com.hanghai.kchtg.assetmovement.repository.YeuCauGiamTaiSanRepository;
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
public class YeuCauGiamTaiSanService {
    private final YeuCauGiamTaiSanRepository repository;
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
    public YeuCauGiamTaiSanResponse create(YeuCauGiamTaiSanRequest request) {
        UUID currentUserId = getCurrentUserId();
        YeuCauGiamTaiSan entity = YeuCauGiamTaiSan.builder()
                .taiSanId(request.getTaiSanId())
                .nguyenNhanGiam(parseNguyenNhanGiam(request.getNguyenNhanGiam()))
                .ngayGiam(Instant.now())
                .moTa(request.getLyDo())
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .deleted(false)
                .build();
        YeuCauGiamTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    public YeuCauGiamTaiSanResponse getById(UUID id) {
        YeuCauGiamTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu giảm tài sản với id: " + id));
        return toResponse(entity);
    }

    public Page<YeuCauGiamTaiSanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<YeuCauGiamTaiSanResponse> findByTaiSanId(UUID taiSanId, Pageable pageable) {
        if (taiSanId == null) return findAll(pageable);
        return repository.findByTaiSanId(taiSanId, pageable).map(this::toResponse);
    }

    @Transactional
    public YeuCauGiamTaiSanResponse update(UUID id, YeuCauGiamTaiSanRequest request) {
        YeuCauGiamTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu giảm tài sản với id: " + id));
        if (request.getTaiSanId() != null) entity.setTaiSanId(request.getTaiSanId());
        if (request.getLyDo() != null) entity.setMoTa(request.getLyDo());
        if (request.getNguyenNhanGiam() != null) entity.setNguyenNhanGiam(parseNguyenNhanGiam(request.getNguyenNhanGiam()));
        entity.setUpdatedBy(getCurrentUserId());
        YeuCauGiamTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy yêu cầu giảm tài sản với id: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public YeuCauGiamTaiSanResponse approve(UUID id, String remarks) {
        YeuCauGiamTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu giảm tài sản với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setTrangThai(TrangThaiYeuCau.DA_PHE_DUYET);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        entity.setUpdatedBy(currentUserId);

        if (entity.getTaiSanId() != null) {
            taiSanRepository.findById(entity.getTaiSanId()).ifPresent(taiSan -> {
                TrangThaiTaiSan targetStatus = TrangThaiTaiSan.HUY;
                if (entity.getNguyenNhanGiam() != null) {
                    switch (entity.getNguyenNhanGiam()) {
                        case GIAI_THE: targetStatus = TrangThaiTaiSan.GIAI_THE; break;
                        case PHA_BO: targetStatus = TrangThaiTaiSan.PHA_BO; break;
                        case HU_HONG: targetStatus = TrangThaiTaiSan.HUY; break;
                        case HET_HAN_SU_DUNG: targetStatus = TrangThaiTaiSan.DECOMMISSION; break;
                    }
                }
                taiSan.setTrangThai(targetStatus);
                taiSan.setApprovedBy(currentUserId);
                taiSan.setApprovedAt(Instant.now());
                taiSanRepository.save(taiSan);
            });
        }

        YeuCauGiamTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public YeuCauGiamTaiSanResponse reject(UUID id, String remarks) {
        YeuCauGiamTaiSan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu giảm tài sản với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setTrangThai(TrangThaiYeuCau.TU_CHOI);
        entity.setUnapprovedBy(currentUserId);
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        entity.setUpdatedBy(currentUserId);

        YeuCauGiamTaiSan saved = repository.save(entity);
        return toResponse(saved);
    }

    private YeuCauGiamTaiSanResponse toResponse(YeuCauGiamTaiSan entity) {
        String tenTaiSan = null;
        String donViTinh = "Cái";

        if (entity.getTaiSanId() != null) {
            var taiSanOpt = taiSanRepository.findById(entity.getTaiSanId());
            if (taiSanOpt.isPresent()) {
                tenTaiSan = taiSanOpt.get().getTenTaiSan();
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

        return YeuCauGiamTaiSanResponse.builder()
                .id(entity.getId())
                .taiSanId(entity.getTaiSanId())
                .tenTaiSan(tenTaiSan)
                .soLuong(1)
                .donViTinh(donViTinh)
                .lyDo(entity.getMoTa())
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .nguyenNhanGiam(entity.getNguyenNhanGiam() != null ? entity.getNguyenNhanGiam().name() : null)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private NguyenNhanGiam parseNguyenNhanGiam(String value) {
        if (value == null) return null;
        try {
            return NguyenNhanGiam.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

