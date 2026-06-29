package com.hanghai.kchtg.luonghanghai.service;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiAttachmentRepository;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.luonghanghai.repository.PheDuyetLichSuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LuongHangHaiService {

    private final LuongHangHaiRepository luongHangHaiRepository;
    private final PheDuyetLichSuRepository pheDuyetLichSuRepository;
    private final LuongHangHaiAttachmentRepository attachmentRepository;

    // -- CRUD --

    @Transactional
    public LuongHangHaiResponse create(LuongHangHaiCreateRequest request) {
        log.info("Creating LuongHangHai: loaiTau={}", request.getLoaiTau());

        if (request.getNgayGhiNhan() != null && request.getNgayGhiNhan().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Ngay ghi nhan khong the be hom nay");
        }

        LuongHangHai entity = LuongHangHai.builder()
                .loaiTau(request.getLoaiTau())
                .soLuong(request.getSoLuong())
                .ngayGhiNhan(request.getNgayGhiNhan())
                .gioDien(request.getGioDien())
                .taiTrong(request.getTaiTrong() != null ? request.getTaiTrong().toPlainString() : null)
                .dienTichDangBo(request.getDienTichDangBo() != null ? request.getDienTichDangBo().toPlainString() : null)
                .ghiChu(request.getGhiChu())
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .createdBy(request.getCreatedBy())
                .build();

        LuongHangHai saved = luongHangHaiRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public LuongHangHaiResponse getById(Long id) {
        LuongHangHai entity = luongHangHaiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<LuongHangHaiResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return luongHangHaiRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public KetQuaTimKiemResponse searchDocuments(String keyword, String statusStr,
                                                    LocalDate ngayGhiNhanStart, LocalDate ngayGhiNhanEnd,
                                                    int page, int size) {
        LuongHangHaiApprovalStatus status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            try {
                status = LuongHangHaiApprovalStatus.valueOf(statusStr);
            } catch (IllegalArgumentException ignored) {
                log.warn("Invalid status: {}", statusStr);
            }
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<LuongHangHai> result = luongHangHaiRepository.searchDocuments(
                keyword, status, ngayGhiNhanStart, ngayGhiNhanEnd, pageable);
        return KetQuaTimKiemResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional
    public LuongHangHaiResponse update(Long id, LuongHangHaiUpdateRequest request) {
        LuongHangHai entity = luongHangHaiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (entity.getApprovalStatus() == LuongHangHaiApprovalStatus.APPROVED) {
            throw new IllegalStateException("Ban ghi da duoc phe duyet, khong the cap nhat");
        }

        if (entity.getApprovalStatus() != LuongHangHaiApprovalStatus.PROPOSED
                && entity.getApprovalStatus() != LuongHangHaiApprovalStatus.UNDER_REVIEW
                && entity.getApprovalStatus() != LuongHangHaiApprovalStatus.REJECTED) {
            throw new IllegalStateException("Chi co the cap nhat ban ghi o trang thai PROPOSED, UNDER_REVIEW, hoac REJECTED");
        }

        if (request.getLoaiTau() != null) entity.setLoaiTau(request.getLoaiTau());
        if (request.getSoLuong() != null) entity.setSoLuong(request.getSoLuong());
        if (request.getNgayGhiNhan() != null) entity.setNgayGhiNhan(request.getNgayGhiNhan());
        if (request.getGioDien() != null) entity.setGioDien(request.getGioDien());
        if (request.getTaiTrong() != null) entity.setTaiTrong(request.getTaiTrong());
        if (request.getDienTichDangBo() != null) entity.setDienTichDangBo(request.getDienTichDangBo());
        if (request.getGhiChu() != null) entity.setGhiChu(request.getGhiChu());
        if (request.getUpdatedBy() != null) entity.setUpdatedBy(request.getUpdatedBy());

        createHistoryEntry(entity, 0, "UPDATED", request.getUpdatedBy() != null ? request.getUpdatedBy() : "system", "Cap nhat ban ghi");

        LuongHangHai saved = luongHangHaiRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        LuongHangHai entity = luongHangHaiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (entity.getApprovalStatus() != LuongHangHaiApprovalStatus.APPROVED) {
            throw new IllegalStateException("Chi co the xoa mem ban ghi da duoc phe duyet");
        }

        if (entity.getAttachments() != null && !entity.getAttachments().isEmpty()) {
            for (LuongHangHaiAttachment att : entity.getAttachments()) {
                log.warn("Can xoa MinIO attachment: {} tai {}", att.getTenTaiLieu(), att.getDuongDan());
            }
        }

        entity.setIsDeleted(true);
        luongHangHaiRepository.save(entity);
        log.info("Soft deleted LuongHangHai with id: {}", id);
    }

    // -- Approval Workflow (2-tier: phong -> cuc) --

    @Transactional
    public PheDuyetResponse approveC1(Long id, PheDuyetRequest request) {
        LuongHangHai entity = luongHangHaiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (entity.getApprovalStatus() != LuongHangHaiApprovalStatus.PROPOSED) {
            throw new IllegalStateException("Ban ghi khong o trang thai cho phep phe duyet cap 1");
        }

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            entity.setPheDuyetC1(true);
            entity.setNguoiPheDuyetC1(request.getApprovedBy());
            entity.setNgayPheDuyetC1(LocalDateTime.now());
            entity.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
            createHistoryEntry(entity, 1, "APPROVED", request.getApprovedBy(), request.getLyDo());
        } else if ("REJECT".equalsIgnoreCase(request.getAction())) {
            entity.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
            entity.setLyDoTuChoi(request.getLyDo());
            createHistoryEntry(entity, 1, "REJECTED", request.getApprovedBy(), request.getLyDo());
        } else {
            throw new IllegalArgumentException("Hanh dong khong hop le: " + request.getAction());
        }

        LuongHangHai saved = luongHangHaiRepository.save(entity);
        return toApproveResponse(saved, 1, request);
    }

    @Transactional
    public PheDuyetResponse approveC2(Long id, PheDuyetRequest request) {
        LuongHangHai entity = luongHangHaiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (entity.getApprovalStatus() != LuongHangHaiApprovalStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Ban ghi khong o trang thai cho phep phe duyet cap 2");
        }

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            entity.setPheDuyetC2(true);
            entity.setNguoiPheDuyetC2(request.getApprovedBy());
            entity.setNgayPheDuyetC2(LocalDateTime.now());
            entity.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
            createHistoryEntry(entity, 2, "APPROVED", request.getApprovedBy(), request.getLyDo());
        } else if ("REJECT".equalsIgnoreCase(request.getAction())) {
            entity.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
            entity.setLyDoTuChoi(request.getLyDo());
            createHistoryEntry(entity, 2, "REJECTED", request.getApprovedBy(), request.getLyDo());
        } else {
            throw new IllegalArgumentException("Hanh dong khong hop le: " + request.getAction());
        }

        LuongHangHai saved = luongHangHaiRepository.save(entity);
        return toApproveResponse(saved, 2, request);
    }

    // -- History --

    @Transactional(readOnly = true)
    public List<HistoryEntry> getApprovalHistory(Long id) {
        LuongHangHai entity = luongHangHaiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        List<PheDuyetLichSu> history = pheDuyetLichSuRepository.findByLuongHangHaiIdOrderByNgayPheDuyetDesc(id);
        return history.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .luongHangHaiId(id)
                .capPheDuyet(h.getCapPheDuyet())
                .trangThai(h.getTrangThai())
                .nguoiPheDuyet(h.getNguoiPheDuyet())
                .ngayPheDuyet(h.getNgayPheDuyet())
                .lyDo(h.getLyDo())
                .build()).collect(Collectors.toList());
    }

    // -- Search / Filter --

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> findByApprovalStatus(LuongHangHaiApprovalStatus status) {
        return luongHangHaiRepository.findByApprovalStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> findByLoaiTauContaining(String keyword) {
        return luongHangHaiRepository.findByLoaiTauContaining(keyword)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // -- Helpers --

    private void createHistoryEntry(LuongHangHai entity, Integer capPheDuyet,
                                     String trangThai, String nguoiPheDuyet, String lyDo) {
        PheDuyetLichSu history = PheDuyetLichSu.builder()
                .luongHangHai(entity)
                .capPheDuyet(capPheDuyet)
                .trangThai(trangThai)
                .nguoiPheDuyet(nguoiPheDuyet)
                .ngayPheDuyet(LocalDate.now())
                .lyDo(lyDo)
                .build();
        pheDuyetLichSuRepository.save(history);
    }

    private LuongHangHaiResponse toResponse(LuongHangHai entity) {
        List<LuongHangHaiAttachmentResponse> attachmentList = new ArrayList<>();
        if (entity.getAttachments() != null) {
            attachmentList = entity.getAttachments().stream()
                    .map(att -> LuongHangHaiAttachmentResponse.builder()
                            .id(att.getId())
                            .tenTaiLieu(att.getTenTaiLieu())
                            .duongDan(att.getDuongDan())
                            .kichThuoc(att.getKichThuoc())
                            .ngayTaiLen(att.getNgayTaiLen())
                            .build())
                    .collect(Collectors.toList());
        }

        List<HistoryEntry> historyList = new ArrayList<>();
        if (entity.getApprovalHistory() != null) {
            historyList = entity.getApprovalHistory().stream()
                    .map(h -> HistoryEntry.builder()
                            .id(h.getId())
                            .luongHangHaiId(entity.getId())
                            .capPheDuyet(h.getCapPheDuyet())
                            .trangThai(h.getTrangThai())
                            .nguoiPheDuyet(h.getNguoiPheDuyet())
                            .ngayPheDuyet(h.getNgayPheDuyet())
                            .lyDo(h.getLyDo())
                            .build())
                    .collect(Collectors.toList());
        }

        return LuongHangHaiResponse.builder()
                .id(entity.getId())
                .loaiTau(entity.getLoaiTau())
                .soLuong(entity.getSoLuong())
                .ngayGhiNhan(entity.getNgayGhiNhan())
                .gioDien(entity.getGioDien())
                .taiTrong(entity.getTaiTrong())
                .dienTichDangBo(entity.getDienTichDangBo())
                .ghiChu(entity.getGhiChu())
                .approvalStatus(entity.getApprovalStatus())
                .pheDuyetC1(entity.getPheDuyetC1())
                .nguoiPheDuyetC1(entity.getNguoiPheDuyetC1())
                .ngayPheDuyetC1(entity.getNgayPheDuyetC1())
                .pheDuyetC2(entity.getPheDuyetC2())
                .nguoiPheDuyetC2(entity.getNguoiPheDuyetC2())
                .ngayPheDuyetC2(entity.getNgayPheDuyetC2())
                .lyDoTuChoi(entity.getLyDoTuChoi())
                .isDeleted(entity.getIsDeleted())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .attachments(attachmentList)
                .approvalHistory(historyList)
                .build();
    }

    private PheDuyetResponse toApproveResponse(LuongHangHai entity, Integer cap, PheDuyetRequest request) {
        return PheDuyetResponse.builder()
                .luongHangHaiId(entity.getId())
                .capPheDuyet(cap)
                .trangThai(entity.getApprovalStatus().name())
                .nguoiPheDuyet(request.getApprovedBy())
                .ngayPheDuyet(LocalDateTime.now())
                .lyDo(request.getLyDo())
                .build();
    }
}
