package com.hanghai.kchtg.deke.service;

import com.hanghai.kchtg.deke.dto.*;
import com.hanghai.kchtg.deke.entity.*;
import com.hanghai.kchtg.deke.repository.DeKeAttachmentRepository;
import com.hanghai.kchtg.deke.repository.DeKeRepository;
import com.hanghai.kchtg.deke.repository.PheDuyetLichSuDeKeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for DeKe (F-044 to F-049).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeKeService {

    private final DeKeRepository repo;
    private final DeKeAttachmentRepository attachmentRepo;
    private final PheDuyetLichSuDeKeRepository pheDuyetLichSuRepo;

    @Transactional
    public DeKeResponse create(DeKeCreateRequest req, String username) {
        DeKe d = DeKe.builder()
                .loaiDe(req.getLoaiDe())
                .viTri(req.getViTri())
                .chieuDai(req.getChieuDai())
                .chieuRong(req.getChieuRong())
                .chieuCao(req.getChieuCao())
                .matVatLieu(req.getMatVatLieu())
                .tinhTrang(req.getTinhTrang())
                .trangThaiPheDuyet(DeKeApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy(username)
                .build();

        // Save attachments if provided
        if (req.getAttachments() != null && !req.getAttachments().isEmpty()) {
            for (DeKeCreateRequest.DeKeAttachmentCreate attReq : req.getAttachments()) {
                DeKeAttachment att = DeKeAttachment.builder()
                        .deKe(d)
                        .tenTaiLieu(attReq.getTenTaiLieu())
                        .duongDan(attReq.getDuongDan())
                        .kichThuoc(attReq.getKichThuoc())
                        .loaiTaiLieu(attReq.getLoaiTaiLieu())
                        .nguoiTaiLen(attReq.getNguoiTaiLen())
                        .build();
                d.getAttachments().add(att);
            }
        }

        return toResponse(repo.save(d));
    }

    @Transactional(readOnly = true)
    public DeKeResponse getById(Long id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id)));
    }

    @Transactional(readOnly = true)
    public List<DeKeResponse> findAll() {
        return repo.findByIsDeletedFalse(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<DeKeResponse> findAll(int page, int size) {
        return repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<DeKeResponse> search(String keyword, String loaiDe, String tinhTrang,
                                      String trangThaiPheDuyetStr, int page, int size) {
        Page<DeKe> results;
        DeKeApprovalStatus trangThaiPheDuyet = null;
        if (trangThaiPheDuyetStr != null && !trangThaiPheDuyetStr.isEmpty()) {
            try { trangThaiPheDuyet = DeKeApprovalStatus.valueOf(trangThaiPheDuyetStr); } catch (Exception ignored) {}
        }
        if (keyword != null && !keyword.isEmpty()) {
            results = repo.searchDocuments(keyword, loaiDe, tinhTrang, trangThaiPheDuyet,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        } else {
            results = repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return results.map(this::toResponse);
    }

    @Transactional
    public DeKeResponse update(Long id, DeKeUpdateRequest req, String username) {
        DeKe d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        if (req.getLoaiDe() != null) d.setLoaiDe(req.getLoaiDe());
        if (req.getViTri() != null) d.setViTri(req.getViTri());
        if (req.getChieuDai() != null) d.setChieuDai(req.getChieuDai());
        if (req.getChieuRong() != null) d.setChieuRong(req.getChieuRong());
        if (req.getChieuCao() != null) d.setChieuCao(req.getChieuCao());
        if (req.getMatVatLieu() != null) d.setMatVatLieu(req.getMatVatLieu());
        if (req.getTinhTrang() != null) d.setTinhTrang(req.getTinhTrang());
        d.setUpdatedBy(username);

        return toResponse(repo.save(d));
    }

    @Transactional
    public void softDelete(Long id) {
        DeKe d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        // Only approved records can be soft-deleted
        if (d.getTrangThaiPheDuyet() != DeKeApprovalStatus.APPROVED) {
            throw new IllegalStateException("Chi co de ke da duyet moi co the xoa mem");
        }

        d.setIsDeleted(true);
        repo.save(d);
        log.info("Soft deleted de ke id={}", id);
    }

    @Transactional
    public PheDuyetResponse approveC1(Long id, PheDuyetRequest req) {
        DeKe d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        if (d.getTrangThaiPheDuyet() != DeKeApprovalStatus.PROPOSED
                && d.getTrangThaiPheDuyet() != DeKeApprovalStatus.REJECTED) {
            throw new IllegalStateException("Chi co the phe duyet C1 khi trang thai la PROPOSED hoac REJECTED");
        }

        d.setPheDuyetC1(true);
        d.setNguoiPheDuyetC1(req.getNguoiPheDuyet());
        d.setNgayPheDuyetC1(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getQuyetDinh())) {
            d.setTrangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW);
        } else {
            d.setTrangThaiPheDuyet(DeKeApprovalStatus.REJECTED);
            d.setLyDoTuChoi(req.getLyDo());
        }

        saveApprovalHistory(d, 1, req.getQuyetDinh(), req.getNguoiPheDuyet(), req.getLyDo());
        return buildPheDuyetResponse(d, 1);
    }

    @Transactional
    public PheDuyetResponse approveC2(Long id, PheDuyetRequest req) {
        DeKe d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        if (d.getTrangThaiPheDuyet() != DeKeApprovalStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Chi co the phe duyet C2 khi trang thai la UNDER_REVIEW");
        }

        String c1Actor = d.getNguoiPheDuyetC1();
        if (c1Actor != null && c1Actor.equals(req.getNguoiPheDuyet())) {
            throw new IllegalStateException("Nguoi phe duyet C2 khong duoc trung voi nguoi phe duyet C1");
        }

        d.setPheDuyetC2(true);
        d.setNguoiPheDuyetC2(req.getNguoiPheDuyet());
        d.setNgayPheDuyetC2(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getQuyetDinh())) {
            d.setTrangThaiPheDuyet(DeKeApprovalStatus.APPROVED);
        } else {
            d.setTrangThaiPheDuyet(DeKeApprovalStatus.REJECTED);
            d.setLyDoTuChoi(req.getLyDo());
        }

        saveApprovalHistory(d, 2, req.getQuyetDinh(), req.getNguoiPheDuyet(), req.getLyDo());
        return buildPheDuyetResponse(d, 2);
    }

    @Transactional
    public PheDuyetResponse reject(Long id, PheDuyetRequest req) {
        DeKe d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        d.setTrangThaiPheDuyet(DeKeApprovalStatus.REJECTED);
        d.setLyDoTuChoi(req.getLyDo());

        Integer cap = req.getCapPheDuyet() != null ? req.getCapPheDuyet() : 1;
        saveApprovalHistory(d, cap, "REJECTED", req.getNguoiPheDuyet(), req.getLyDo());
        return buildPheDuyetResponse(d, cap);
    }

    private void saveApprovalHistory(DeKe d, Integer cap, String status, String user, String reason) {
        PheDuyetLichSu hist = PheDuyetLichSu.builder()
                .deKe(d)
                .capPheDuyet(cap)
                .trangThai(status)
                .nguoiPheDuyet(user)
                .ngayPheDuyet(LocalDate.now())
                .lyDo(reason)
                .build();
        pheDuyetLichSuRepo.save(hist);
        d.getApprovalHistory().add(hist);
    }

    private PheDuyetResponse buildPheDuyetResponse(DeKe d, Integer cap) {
        return PheDuyetResponse.builder()
                .id(d.getId())
                .deKeId(d.getId())
                .capPheDuyet(cap)
                .trangThai(d.getTrangThaiPheDuyet().name())
                .nguoiPheDuyet(cap == 1 ? d.getNguoiPheDuyetC1() : d.getNguoiPheDuyetC2())
                .ngayPheDuyet(cap == 1 ? d.getNgayPheDuyetC1() : d.getNgayPheDuyetC2())
                .lyDo(d.getLyDoTuChoi())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getApprovalHistory(Long id) {
        DeKe d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        List<PheDuyetLichSu> history = pheDuyetLichSuRepo.findByDeKeIdOrderByNgayPheDuyetDesc(id);
        return history.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .deKeId(h.getDeKe().getId())
                .capPheDuyet(h.getCapPheDuyet())
                .trangThai(h.getTrangThai())
                .nguoiPheDuyet(h.getNguoiPheDuyet())
                .ngayPheDuyet(h.getNgayPheDuyet())
                .lyDo(h.getLyDo())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeKeResponse> findByTrangThaiPheDuyet(DeKeApprovalStatus s) {
        return repo.findByTrangThaiPheDuyetAndIsDeletedFalse(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeKeResponse> searchByLoaiDeContaining(String kw) {
        return repo.findByLoaiDeContainingAndIsDeletedFalse(kw)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KetQuaTimKiemResponse searchDocuments(String kw, String loaiDe, String tinhTrang, String trangThaiStr, int page, int size) {
        DeKeApprovalStatus trangThai = null;
        if (trangThaiStr != null && !trangThaiStr.isEmpty()) {
            try { trangThai = DeKeApprovalStatus.valueOf(trangThaiStr); } catch (Exception ignored) {}
        }
        Page<DeKe> r = repo.searchDocuments(kw, loaiDe, tinhTrang, trangThai, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return KetQuaTimKiemResponse.builder()
                .results(r.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(r.getTotalElements())
                .totalPages(r.getTotalPages())
                .currentPage(r.getNumber())
                .pageSize(r.getSize())
                .build();
    }

    private DeKeResponse toResponse(DeKe d) {
        List<DeKeAttachmentResponse> atts = d.getAttachments() != null
                ? d.getAttachments().stream()
                        .map(a -> DeKeAttachmentResponse.builder()
                                .id(a.getId())
                                .tenTaiLieu(a.getTenTaiLieu())
                                .duongDan(a.getDuongDan())
                                .kichThuoc(a.getKichThuoc())
                                .loaiTaiLieu(a.getLoaiTaiLieu())
                                .nguoiTaiLen(a.getNguoiTaiLen())
                                .ngayTaiLen(a.getNgayTaiLen())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        List<PheDuyetResponse> hist = d.getApprovalHistory() != null
                ? d.getApprovalHistory().stream()
                        .map(h -> PheDuyetResponse.builder()
                                .id(h.getId())
                                .deKeId(h.getDeKe().getId())
                                .capPheDuyet(h.getCapPheDuyet())
                                .trangThai(h.getTrangThai())
                                .nguoiPheDuyet(h.getNguoiPheDuyet())
                                .ngayPheDuyet(h.getNgayPheDuyet())
                                .lyDo(h.getLyDo())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return DeKeResponse.builder()
                .id(d.getId())
                .loaiDe(d.getLoaiDe())
                .viTri(d.getViTri())
                .chieuDai(d.getChieuDai())
                .chieuRong(d.getChieuRong())
                .chieuCao(d.getChieuCao())
                .matVatLieu(d.getMatVatLieu())
                .tinhTrang(d.getTinhTrang())
                .trangThaiPheDuyet(d.getTrangThaiPheDuyet())
                .pheDuyetC1(d.getPheDuyetC1())
                .nguoiPheDuyetC1(d.getNguoiPheDuyetC1())
                .ngayPheDuyetC1(d.getNgayPheDuyetC1())
                .pheDuyetC2(d.getPheDuyetC2())
                .nguoiPheDuyetC2(d.getNguoiPheDuyetC2())
                .ngayPheDuyetC2(d.getNgayPheDuyetC2())
                .lyDoTuChoi(d.getLyDoTuChoi())
                .isDeleted(d.getIsDeleted())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .createdBy(d.getCreatedBy())
                .updatedBy(d.getUpdatedBy())
                .attachments(atts)
                .approvalHistory(hist)
                .build();
    }
}

