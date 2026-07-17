package com.hanghai.kchtg.luonghanghai.service;

import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.*;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.luonghanghai.repository.PheDuyetLichSuRepository;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
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
    private final GisSpatialObjectService gisSpatialObjectService;

    @Transactional
    public LuongHangHaiResponse create(LuongHangHaiCreateRequest req, String username) {
        LuongHangHai l = LuongHangHai.builder()
                .ten(req.getTen())
                .soLuong(req.getSoLuong())
                .ngayGhiNhan(req.getNgayGhiNhan())
                .gioDien(req.getGioDien())
                .taiTrong(req.getTaiTrong())
                .dienTichDangBo(req.getDienTichDangBo())
                .ghiChu(req.getGhiChu())
                .donViId(req.getDonViId())
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy(username)
                .build();

        l = repo.save(l);

        if (req.getToaDo() != null && !req.getToaDo().trim().isEmpty()) {
            GisGeometryType geomType = req.getLoaiHinhHoc() != null ? req.getLoaiHinhHoc() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = UUID.nameUUIDFromBytes(("LUONGHANGHAI_" + l.getId()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    req.getTen(),
                    "LUONG_" + l.getId(),
                    geomType,
                    objType,
                    req.getToaDo(),
                    req.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.LUONGHANGHAI
            );
            l.setKhongGianId(spatialObj.getId());
            l = repo.save(l);
        }

        return toResponse(l);
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
    public Page<LuongHangHaiResponse> search(UUID orgUnitId, String keyword, String gioDien, String taiTrong,
                                             String approvalStatusStr, int page, int size) {
        Page<LuongHangHai> results;
        LuongHangHaiApprovalStatus approvalStatus = null;
        if (approvalStatusStr != null && !approvalStatusStr.isEmpty()) {
            try { approvalStatus = LuongHangHaiApprovalStatus.valueOf(approvalStatusStr); } catch (Exception ignored) {}
        }
        if (orgUnitId != null || (keyword != null && !keyword.isEmpty())) {
            results = repo.searchDocuments(orgUnitId, keyword, gioDien, taiTrong, approvalStatus,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        } else {
            results = repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return results.map(this::toResponse);
    }

    @Transactional
    public LuongHangHaiResponse update(Long id, LuongHangHaiUpdateRequest req, String username) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (req.getTen() != null) l.setTen(req.getTen());
        if (req.getSoLuong() != null) l.setSoLuong(req.getSoLuong());
        if (req.getNgayGhiNhan() != null) l.setNgayGhiNhan(req.getNgayGhiNhan());
        if (req.getGioDien() != null) l.setGioDien(req.getGioDien());
        if (req.getTaiTrong() != null) l.setTaiTrong(req.getTaiTrong());
        if (req.getDienTichDangBo() != null) l.setDienTichDangBo(req.getDienTichDangBo());
        if (req.getGhiChu() != null) l.setGhiChu(req.getGhiChu());
        if (req.getDonViId() != null) l.setDonViId(req.getDonViId());
        l.setUpdatedBy(username);

        if (req.getToaDo() != null) {
            if (req.getToaDo().trim().isEmpty()) {
                if (l.getKhongGianId() != null) {
                    gisSpatialObjectService.delete(l.getKhongGianId());
                    l.setKhongGianId(null);
                }
            } else {
                GisGeometryType geomType = req.getLoaiHinhHoc() != null ? req.getLoaiHinhHoc() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = UUID.nameUUIDFromBytes(("LUONGHANGHAI_" + l.getId()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        l.getKhongGianId(),
                        l.getTen(),
                        "LUONG_" + l.getId(),
                        geomType,
                        objType,
                        req.getToaDo(),
                        req.getBieuTuongId(),
                        refId,
                        com.hanghai.kchtg.gis.search.dto.KchtType.LUONGHANGHAI
                );
                l.setKhongGianId(spatialObj.getId());
            }
        } else if (l.getKhongGianId() != null && req.getTen() != null) {
            gisSpatialObjectService.findById(l.getKhongGianId()).ifPresent(spatialObj -> {
                UUID refId = UUID.nameUUIDFromBytes(("LUONGHANGHAI_" + l.getId()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        req.getTen(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        spatialObj.getBieuTuongId(),
                        refId,
                        com.hanghai.kchtg.gis.search.dto.KchtType.LUONGHANGHAI
                );
            });
        }

        LuongHangHai saved = repo.save(l);
        return toResponse(saved);
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
        if (l.getKhongGianId() != null) {
            gisSpatialObjectService.delete(l.getKhongGianId());
        }
        repo.save(l);
        log.info("Soft deleted luong hang hai id={}", id);
    }

    @Transactional
    public PheDuyetResponse approveC1(Long id, PheDuyetRequest req, String approvedBy) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (l.getApprovalStatus() != LuongHangHaiApprovalStatus.PROPOSED
                && l.getApprovalStatus() != LuongHangHaiApprovalStatus.REJECTED) {
            throw new IllegalStateException("Chi co the phe duyet C1 khi trang thai la PROPOSED hoac REJECTED");
        }

        l.setPheDuyetC1(true);
        l.setNguoiPheDuyetC1(approvedBy);
        l.setNgayPheDuyetC1(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getTrangThai())) {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.UNDER_REVIEW);
        } else {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
            l.setLyDoTuChoi(req.getLyDo());
        }

        saveApprovalHistory(l, 1, req.getTrangThai(), approvedBy, req.getLyDo());
        return buildPheDuyetResponse(l, 1);
    }

    @Transactional
    public PheDuyetResponse approveC2(Long id, PheDuyetRequest req, String approvedBy) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (l.getApprovalStatus() != LuongHangHaiApprovalStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Chi co the phe duyet C2 khi trang thai la UNDER_REVIEW");
        }

        String c1Actor = l.getNguoiPheDuyetC1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException("Nguoi phe duyet C2 khong duoc trung voi nguoi phe duyet C1");
        }

        l.setPheDuyetC2(true);
        l.setNguoiPheDuyetC2(approvedBy);
        l.setNgayPheDuyetC2(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getTrangThai())) {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        } else {
            l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
            l.setLyDoTuChoi(req.getLyDo());
        }

        saveApprovalHistory(l, 2, req.getTrangThai(), approvedBy, req.getLyDo());
        return buildPheDuyetResponse(l, 2);
    }

    @Transactional
    public PheDuyetResponse reject(Long id, PheDuyetRequest req, String approvedBy) {
        LuongHangHai l = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        l.setApprovalStatus(LuongHangHaiApprovalStatus.REJECTED);
        l.setLyDoTuChoi(req.getLyDo());

        Integer cap = req.getCapPheDuyet() != null ? req.getCapPheDuyet() : 1;
        saveApprovalHistory(l, cap, "REJECTED", approvedBy, req.getLyDo());
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
    public List<LuongHangHaiResponse> searchByTenContaining(String kw) {
        return repo.findByTenContainingAndIsDeletedFalse(kw)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KetQuaTimKiemResponse searchDocuments(UUID orgUnitId, String kw, String gioDien, String taiTrong, String trangThaiStr, int page, int size) {
        LuongHangHaiApprovalStatus trangThai = null;
        if (trangThaiStr != null && !trangThaiStr.trim().isEmpty()) {
            try { trangThai = LuongHangHaiApprovalStatus.valueOf(trangThaiStr.trim()); } catch (Exception ignored) {}
        }
        String keywordLike = (kw != null && !kw.trim().isEmpty()) ? "%" + kw.trim().toLowerCase() + "%" : null;
        String gioDienVal = (gioDien != null && !gioDien.trim().isEmpty()) ? gioDien.trim() : null;
        String taiTrongVal = (taiTrong != null && !taiTrong.trim().isEmpty()) ? taiTrong.trim() : null;
        Page<LuongHangHai> r = repo.searchDocuments(orgUnitId, keywordLike, gioDienVal, taiTrongVal, trangThai, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
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

        GisGeometryType geomType = null;
        String coords = null;
        if (l.getKhongGianId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(l.getKhongGianId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        return LuongHangHaiResponse.builder()
                .id(l.getId())
                .ten(l.getTen())
                .soLuong(l.getSoLuong())
                .ngayGhiNhan(l.getNgayGhiNhan())
                .gioDien(l.getGioDien())
                .taiTrong(l.getTaiTrong())
                .dienTichDangBo(l.getDienTichDangBo())
                .ghiChu(l.getGhiChu())
                .donViId(l.getDonViId())
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
                .khongGianId(l.getKhongGianId())
                .loaiHinhHoc(geomType)
                .toaDo(coords)
                .build();
    }

    private GisGeometryType parseGeometryType(String typeStr) {
        if (typeStr == null) return GisGeometryType.LINE;
        try {
            return GisGeometryType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return GisGeometryType.LINE;
        }
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_SHIPPING_ROUTE;
    }
}
