package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.BaoCaoKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiBaoCao;
import com.hanghai.kchtg.assetmovement.repository.BaoCaoKiemKeRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserRepository userRepository;

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName())
                    .map(User::getId)
                    .orElse(null);
        }
        return null;
    }

    @Transactional
    public BaoCaoKiemKeResponse create(BaoCaoKiemKeRequest request) {
        UUID currentUserId = getCurrentUserId();
        BaoCaoKiemKe entity = BaoCaoKiemKe.builder()
                .keHoachId(request.getKeHoachId())
                .tongSoTaiSan(request.getTongSoLuong())
                .soThua(request.getSoLuongChenhLech() > 0 ? request.getSoLuongChenhLech() : 0)
                .soThieu(request.getSoLuongChenhLech() < 0 ? -request.getSoLuongChenhLech() : 0)
                .moTa(request.getMoTa())
                .trangThai(TrangThaiBaoCao.CHO_PHE_DUYET)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
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
        if (keHoachId == null)
            return findAll(pageable);
        return repository.findByKeHoachId(keHoachId, pageable).map(this::toResponse);
    }

    @Transactional
    public BaoCaoKiemKeResponse update(UUID id, BaoCaoKiemKeRequest request) {
        BaoCaoKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id));
        if (request.getMoTa() != null)
            entity.setMoTa(request.getMoTa());
        BaoCaoKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id))
            throw new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public BaoCaoKiemKeResponse approve(UUID id, String remarks) {
        BaoCaoKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id));
        entity.setTrangThai(TrangThaiBaoCao.DA_PHE_DUYET);
        entity.setApprovedBy(getCurrentUserId());
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        BaoCaoKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public BaoCaoKiemKeResponse reject(UUID id, String remarks) {
        BaoCaoKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy báo cáo kiểm kê với id: " + id));
        entity.setTrangThai(TrangThaiBaoCao.TU_CHOI);
        entity.setUnapprovedBy(getCurrentUserId());
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        BaoCaoKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    private BaoCaoKiemKeResponse toResponse(BaoCaoKiemKe entity) {
        String createdByName = null;
        if (entity.getCreatedBy() != null) {
            java.util.Optional<User> userOpt = userRepository.findById(entity.getCreatedBy());
            if (userOpt.isPresent()) {
                createdByName = userOpt.get().getFullName();
                if (createdByName == null || createdByName.isEmpty()) {
                    createdByName = userOpt.get().getUsername();
                }
            }
        }

        return BaoCaoKiemKeResponse.builder()
                .id(entity.getId())
                .keHoachId(entity.getKeHoachId())
                .tenBaoCao(null)
                .tongSoLuong(entity.getTongSoTaiSan() != null ? entity.getTongSoTaiSan() : 0)
                .soLuongChenhLech(entity.getSoThua() != null ? entity.getSoThua() - entity.getSoThieu() : 0)
                .ketQua(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .moTa(entity.getMoTa())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }

    private java.time.LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null)
            return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
