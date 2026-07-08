package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.KeHoachKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKeHoach;
import com.hanghai.kchtg.assetmovement.repository.KeHoachKiemKeRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KeHoachKiemKeService {
    private final KeHoachKiemKeRepository repository;
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
    public KeHoachKiemKeResponse create(KeHoachKiemKeRequest request) {
        if (request.getNgayBatDau() != null && request.getNgayKetThuc() != null) {
            LocalDate startDate = LocalDate.ofInstant(request.getNgayBatDau(), ZoneId.systemDefault());
            LocalDate endDate = LocalDate.ofInstant(request.getNgayKetThuc(), ZoneId.systemDefault());
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("Ngày bắt đầu không được lớn hơn ngày kết thúc");
            }
        }
        UUID currentUserId = getCurrentUserId();
        KeHoachKiemKe entity = KeHoachKiemKe.builder()
                .tenKeHoach(request.getTenKeHoach())
                .loaiKiemKe(request.getLoaiKiemKe())
                .phamVi(request.getPhamVi())
                .ngayBatDau(request.getNgayBatDau())
                .ngayKetThuc(request.getNgayKetThuc())
                .toTruongKiemKe(request.getToTruongKiemKe())
                .moTa(request.getMoTa())
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
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
        if (trangThai == null)
            return findAll(pageable);
        return repository.findByTrangThai(trangThai, pageable).map(this::toResponse);
    }

    @Transactional
    public KeHoachKiemKeResponse update(UUID id, KeHoachKiemKeRequest request) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        if (request.getPhamVi() != null)
            entity.setPhamVi(request.getPhamVi());
        if (request.getMoTa() != null)
            entity.setMoTa(request.getMoTa());
        if (request.getTenKeHoach() != null)
            entity.setTenKeHoach(request.getTenKeHoach());
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id))
            throw new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id);
        repository.deleteById(id);
    }

    public long countByTrangThai(TrangThaiKeHoach trangThai) {
        return repository.countByTrangThai(trangThai);
    }

    @Transactional
    public KeHoachKiemKeResponse approve(UUID id, String remarks) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        entity.setTrangThai(TrangThaiKeHoach.DA_PHE_DUYET);
        entity.setApprovedBy(getCurrentUserId());
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public KeHoachKiemKeResponse reject(UUID id, String remarks) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        entity.setTrangThai(TrangThaiKeHoach.TU_CHOI);
        entity.setUnapprovedBy(getCurrentUserId());
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public KeHoachKiemKeResponse startExecution(UUID id) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        entity.setTrangThai(TrangThaiKeHoach.DANG_THUC_HIEN);
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public KeHoachKiemKeResponse completeExecution(UUID id) {
        KeHoachKiemKe entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kế hoạch kiểm kê với id: " + id));
        entity.setTrangThai(TrangThaiKeHoach.HOAN_THANH);
        KeHoachKiemKe saved = repository.save(entity);
        return toResponse(saved);
    }

    private KeHoachKiemKeResponse toResponse(KeHoachKiemKe entity) {
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

        return KeHoachKiemKeResponse.builder()
                .id(entity.getId())
                .tenKeHoach(entity.getTenKeHoach())
                .moTa(entity.getMoTa())
                .trangThai(entity.getTrangThai() != null ? entity.getTrangThai().name() : null)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(toLocalDateTime(entity.getCreatedAt()))
                .updatedAt(toLocalDateTime(entity.getUpdatedAt()))
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null)
            return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
