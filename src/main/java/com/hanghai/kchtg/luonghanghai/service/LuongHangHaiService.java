package com.hanghai.kchtg.luonghanghai.service;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.luonghanghai.repository.PheDuyetLichSuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for LuongHangHai (F-038 to F-043).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LuongHangHaiService {

    private final LuongHangHaiRepository repo;
    private final PheDuyetLichSuRepository pheDuyetLichSuRepo;

    @Transactional
    public LuongHangHaiResponse create(LuongHangHaiCreateRequest req) {
        LuongHangHai l = LuongHangHai.builder()
                .loaiTau(req.getLoaiTau())
                .soLuong(req.getSoLuong())
                .ngayGhiNhan(req.getNgayGhiNhan())
                .gioDien(req.getGioDien())
                .taiTrong(req.getTaiTrong())
                .dienTichDangBo(req.getDienTichDangBo())
                .ghiChu(req.getGhiChu())
                .approvalStatus(req.getApprovalStatus() != null ? req.getApprovalStatus() : LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy(req.getCreatedBy())
                .build();

        return toResponse(repo.save(l));
    }

    @Transactional(readOnly = true)
    public LuongHangHaiResponse getById(Long id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id)));
    }

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> findAll() {
        return repo.findByIsDeletedFalse(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<LuongHangHaiResponse> findAll(int page, int size) {
        return repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<LuongHangHaiResponse> search(String keyword, String gioDien, String taiTrong,
                                             String approvalStatusStr, int page, int size) {
        Page<LuongHangHai> results;
        LuongHangHaiApprovalStatus approvalStatus = null;
        if (approvalStatusStr != null && !approvalStatusStr.isEmpty()) {
            try { approvalStatus = LuongHangHaiApprovalStatus.valueOf(approvalStatusStr); } catch (Exception ignored) {}
        }
        if (keyword != null && !keyword.isEmpty()) {
            results = repo.searchDocuments(keyword, gioDien, taiTrong, approvalStatus,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        } else {
            results = repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return results.map(this::toResponse);
    }

    @Transactional
    public LuongHangHaiResponse update(Long id, LuongHangHaiUpdateRequest req) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (req.getLoaiTau() != null) l.setLoaiTau(req.getLoaiTau());
        if (req.getSoLuong() != null) l.setSoLuong(req.getSoLuong());
        if (req.getNgayGhiNhan() != null) l.setNgayGhiNhan(req.getNgayGhiNhan());
        if (req.getGioDien() != null) l.setGioDien(req.getGioDien());
        if (req.getTaiTrong() != null) l.setTaiTrong(req.getTaiTrong());
        if (req.getDienTichDangBo() != null) l.setDienTichDangBo(req.getDienTichDangBo());
        if (req.getGhiChu() != null) l.setGhiChu(req.getGhiChu());
        if (req.getUpdatedBy() != null) l.setUpdatedBy(req.getUpdatedBy());

        return toResponse(repo.save(l));
    }

    @Transactional
    public void softDelete(Long id) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        // Only approved records can be soft-deleted
        if (l.getApprovalStatus() != LuongHangHaiApprovalStatus.APPROVED) {
            throw new IllegalStateException("Chi co luong hang hai da duyet moi co the xoa mem");
        }

        l.setIsDeleted(true);
        repo.save(l);
        log.info("Soft deleted luong hang hai id={}", id);
    }

    @Transactional
    public PheDuyetResponse approveC1(Long id, PheDuyetRequest req) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (l.getApprovalStatus() != LuongHangHaiApprovalStatus.PROPOSED
                && l.getApprovalStatus() != LuongHangHaiApprovalStatus.REJECTED) {
            throw new IllegalStateException("Chi co the phe duyet C1 khi trang thai la PROPOSED hoac REJECTED");
        }

        l.setPheDuyetC1(true);
        l.setNguoiPheDuyetC1(req.getNguoiPheDuyet());
        l.setNgayPheDuyetC1(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getTrangThai())) {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        } else {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
            l.setLyDoTuChoi(req.getLyDo());
        }

        saveApprovalHistory(l, 1, req.getTrangThai(), req.getNguoiPheDuyet(), req.getLyDo());
        return buildPheDuyetResponse(l, 1);
    }

    @Transactional
    public PheDuyetResponse approveC2(Long id, PheDuyetRequest req) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (l.getApprovalStatus() != LuongHangHaiApprovalStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Chi co the phe duyet C2 khi trang thai la UNDER_REVIEW");
        }

        l.setPheDuyetC2(true);
        l.setNguoiPheDuyetC2(req.getNguoiPheDuyet());
        l.setNgayPheDuyetC2(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getTrangThai())) {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        } else {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
            l.setLyDoTuChoi(req.getLyDo());
        }

        saveApprovalHistory(l, 2, req.getTrangThai(), req.getNguoiPheDuyet(), req.getLyDo());
        return buildPheDuyetResponse(l, 2);
    }

    @Transactional
    public PheDuyetResponse reject(Long id, PheDuyetRequest req) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
        l.setLyDoTuChoi(req.getLyDo());

        Integer cap = req.getCapPheDuyet() != null ? req.getCapPheDuyet() : 1;
        saveApprovalHistory(l, cap, "REJECTED", req.getNguoiPheDuyet(), req.getLyDo());
        return buildPheDuyetResponse(l, cap);
    }

    private void saveApprovalHistory(LuongHangHai l, Integer cap, String status, String user, String reason) {
        PheDuyetLichSu hist = PheDuyetLichSu.builder()
                .luongHangHai(l)
                .capPheDuyet(cap)
                .trangThai(status)
                .nguoiPheDuyet(user)
                .ngayPheDuyet(LocalDate.now())
                .lyDo(reason)
                .build();
        pheDuyetLichSuRepo.save(hist);
        l.getApprovalHistory().add(hist);
    }

    private PheDuyetResponse buildPheDuyetResponse(LuongHangHai l, Integer cap) {
        return PheDuyetResponse.builder()
                .id(l.getId())
                .luongHangHaiId(l.getId())
                .capPheDuyet(cap)
                .trangThai(l.getApprovalStatus().name())
                .nguoiPheDuyet(cap == 1 ? l.getNguoiPheDuyetC1() : l.getNguoiPheDuyetC2())
                .ngayPheDuyet(cap == 1 ? l.getNgayPheDuyetC1() : l.getNgayPheDuyetC2())
                .lyDo(l.getLyDoTuChoi())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getApprovalHistory(Long id) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        List<PheDuyetLichSu> history = pheDuyetLichSuRepo.findByLuongHangHaiIdOrderByNgayPheDuyetDesc(id);
        return history.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .luongHangHaiId(h.getLuongHangHai().getId())
                .capPheDuyet(h.getCapPheDuyet())
                .trangThai(h.getTrangThai())
                .nguoiPheDuyet(h.getNguoiPheDuyet())
                .ngayPheDuyet(h.getNgayPheDuyet())
                .lyDo(h.getLyDo())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> findByApprovalStatus(LuongHangHaiApprovalStatus s) {
        return repo.findByApprovalStatusAndIsDeletedFalse(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> searchByLoaiTauContaining(String kw) {
        return repo.findByLoaiTauContainingAndIsDeletedFalse(kw)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KetQuaTimKiemResponse searchDocuments(String kw, String gioDien, String taiTrong, String trangThaiStr, int page, int size) {
        LuongHangHaiApprovalStatus trangThai = null;
        if (trangThaiStr != null && !trangThaiStr.isEmpty()) {
            try { trangThai = LuongHangHaiApprovalStatus.valueOf(trangThaiStr); } catch (Exception ignored) {}
        }
        Page<LuongHangHai> r = repo.searchDocuments(kw, gioDien, taiTrong, trangThai, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return KetQuaTimKiemResponse.builder()
                .results(r.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(r.getTotalElements())
                .totalPages(r.getTotalPages())
                .currentPage(r.getNumber())
                .pageSize(r.getSize())
                .build();
    }

    private LuongHangHaiResponse toResponse(LuongHangHai l) {
        List<LuongHangHaiAttachmentResponse> atts = l.getAttachments() != null
                ? l.getAttachments().stream()
                        .map(a -> LuongHangHaiAttachmentResponse.builder()
                                .id(a.getId())
                                .tenTaiLieu(a.getTenTaiLieu())
                                .duongDan(a.getDuongDan())
                                .kichThuoc(a.getKichThuoc())
                                .ngayTaiLen(a.getNgayTaiLen())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        List<PheDuyetResponse> hist = l.getApprovalHistory() != null
                ? l.getApprovalHistory().stream()
                        .map(h -> PheDuyetResponse.builder()
                                .id(h.getId())
                                .luongHangHaiId(h.getLuongHangHai().getId())
                                .capPheDuyet(h.getCapPheDuyet())
                                .trangThai(h.getTrangThai())
                                .nguoiPheDuyet(h.getNguoiPheDuyet())
                                .ngayPheDuyet(h.getNgayPheDuyet())
                                .lyDo(h.getLyDo())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return LuongHangHaiResponse.builder()
                .id(l.getId())
                .loaiTau(l.getLoaiTau())
                .soLuong(l.getSoLuong())
                .ngayGhiNhan(l.getNgayGhiNhan())
                .gioDien(l.getGioDien())
                .taiTrong(l.getTaiTrong())
                .dienTichDangBo(l.getDienTichDangBo())
                .ghiChu(l.getGhiChu())
                .approvalStatus(l.getApprovalStatus())
                .pheDuyetC1(l.getPheDuyetC1())
                .nguoiPheDuyetC1(l.getNguoiPheDuyetC1())
                .ngayPheDuyetC1(l.getNgayPheDuyetC1())
                .pheDuyetC2(l.getPheDuyetC2())
                .nguoiPheDuyetC2(l.getNguoiPheDuyetC2())
                .ngayPheDuyetC2(l.getNgayPheDuyetC2())
                .lyDoTuChoi(l.getLyDoTuChoi())
                .isDeleted(l.getIsDeleted())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .createdBy(l.getCreatedBy())
                .updatedBy(l.getUpdatedBy())
                .attachments(atts)
                .approvalHistory(hist)
                .build();
    }
}
