package com.hanghai.kchtg.luonghanghai.service;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class LuongHangHaiService {
    private final LuongHangHaiRepository repo;

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
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy(req.getCreatedBy())
                .build();
        if (req.getAttachments() != null && !req.getAttachments().isEmpty()) {
            l.setAttachments(req.getAttachments().stream()
                    .map(a -> LuongHangHaiAttachment.builder()
                            .luongHangHai(l)
                            .tenTaiLieu(a.getTenTaiLieu())
                            .duongDan(a.getDuongDan())
                            .kichThuoc(a.getKichThuoc())
                            .ngayTaiLen(a.getNgayTaiLen())
                            .build())
                    .collect(Collectors.toList()));
        }
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
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<LuongHangHaiResponse> findAll(int page, int size) {
        return repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
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
    public void delete(Long id) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));
        l.setIsDeleted(true);
        repo.save(l);
    }

    @Transactional
    public PheDuyetResponse approve(Long id, PheDuyetRequest req) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        String cap = req.getCapPheDuyet() != null ? req.getCapPheDuyet() : "C1";
        LuongHangHaiApprovalStatus cur = l.getApprovalStatus();

        if ("C1".equalsIgnoreCase(cap)) {
            if (cur == LuongHangHaiApprovalStatus.PROPOSED || cur == LuongHangHaiApprovalStatus.REJECTED) {
                l.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
                l.setPheDuyetC1("APPROVED".equalsIgnoreCase(req.getTrangThai()));
            }
        } else if ("C2".equalsIgnoreCase(cap)) {
            if (cur == LuongHangHaiApprovalStatus.UNDER_REVIEW) {
                if ("APPROVED".equalsIgnoreCase(req.getTrangThai())) {
                    l.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
                    l.setPheDuyetC2(true);
                } else if ("REJECTED".equalsIgnoreCase(req.getTrangThai())) {
                    l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
                    l.setPheDuyetC2(false);
                }
            }
        }

        // Set approver info
        if ("C1".equalsIgnoreCase(cap)) {
            l.setNguoiPheDuyetC1(req.getNguoiPheDuyet());
            l.setNgayPheDuyetC1(java.time.LocalDate.now());
        } else if ("C2".equalsIgnoreCase(cap)) {
            l.setNguoiPheDuyetC2(req.getNguoiPheDuyet());
            l.setNgayPheDuyetC2(java.time.LocalDate.now());
        }

        // Set rejection reason if applicable
        if ("REJECTED".equalsIgnoreCase(req.getTrangThai()) && req.getGhiChu() != null) {
            l.setLyDoTuChoi(req.getGhiChu());
        }

        // Record approval history
        PheDuyetLichSu history = PheDuyetLichSu.builder()
                .luongHangHai(l)
                .capPheDuyet(Integer.parseInt(cap.replaceAll("[^0-9]", "")))
                .trangThai(req.getTrangThai())
                .nguoiPheDuyet(req.getNguoiPheDuyet())
                .ngayPheDuyet(java.time.LocalDate.now())
                .lyDo(req.getGhiChu())
                .build();
        l.getApprovalHistory().add(history);

        LuongHangHai saved = repo.save(l);
        return PheDuyetResponse.builder()
                .luongHangHaiId(saved.getId())
                .capPheDuyet(cap)
                .trangThai(saved.getApprovalStatus().name())
                .nguoiPheDuyet(req.getNguoiPheDuyet())
                .ghiChu(req.getGhiChu())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(Long id) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));
        List<HistoryEntry> h = new ArrayList<>();

        // Initial creation entry
        h.add(HistoryEntry.builder()
                .thoiGian(l.getCreatedAt() != null ? l.getCreatedAt().toString() : null)
                .nguoiThucHien(l.getCreatedBy())
                .tuTrangThai(null)
                .sangTrangTai("PROPOSED")
                .ghiChu("Tao moi luong hang hai")
                .build());

        // Approval history entries
        if (l.getApprovalHistory() != null) {
            for (PheDuyetLichSu ph : l.getApprovalHistory()) {
                h.add(HistoryEntry.builder()
                        .thoiGian(ph.getNgayPheDuyet() != null ? ph.getNgayPheDuyet().toString() : null)
                        .nguoiThucHien(ph.getNguoiPheDuyet())
                        .tuTrangThai(null)
                        .sangTrangThai(ph.getTrangThai())
                        .ghiChu(ph.getLyDo())
                        .build());
            }
        }

        // Update entries from entity state
        if (l.getUpdatedAt() != null) {
            h.add(HistoryEntry.builder()
                    .thoiGian(l.getUpdatedAt().toString())
                    .nguoiThucHien(l.getUpdatedBy())
                    .tuTrangThai(null)
                    .sangTrangThai(l.getApprovalStatus().name())
                    .ghiChu("Cap nhat luong hang hai")
                    .build());
        }

        return h;
    }

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> findByApprovalStatus(LuongHangHaiApprovalStatus s) {
        return repo.findByApprovalStatusAndIsDeletedFalse(s)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LuongHangHaiResponse> searchByLoaiTauContaining(String kw) {
        return repo.findByLoaiTauContainingAndIsDeletedFalse(kw)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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
                            .luongHangHaiId(l.getId())
                            .capPheDuyet(h.getCapPheDuyet() != null ? h.getCapPheDuyet().toString() : null)
                            .trangThai(h.getTrangThai())
                            .nguoiPheDuyet(h.getNguoiPheDuyet())
                            .ghiChu(h.getLyDo())
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
