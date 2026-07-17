package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.bencang.*;
import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service core for BenCang (berth) CRUD operations.
 * Covers F-014 (create), F-015 (update), F-016 (soft-delete), F-017 (list).
 * <p>
 * Business rules:
 * - Code (maBen) is immutable after creation — duplicate detection on create
 * - Approval status always set to CHO_PHE_DUYET on create/update
 * - softDelete optional guard: parent CangBien must be hien_hanh (optional)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BenCangService {

    private final BenCangRepository benCangRepository;
    private final CangBienRepository cangBienRepository;
    private final CauCangRepository cauCangRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @Transactional
    public BenCangResponse create(CreateBenCangRequest request) {
        if (benCangRepository.existsByMaBen(request.getMaBen())) {
            throw new IllegalArgumentException("Mã " + request.getMaBen() + " đã tồn tại");
        }
        CangBien parent = cangBienRepository.findById(request.getCangBienId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getCangBienId()));

        // Guard: parent CangBien must be in hien_hanh (active) status
        if (parent.getTrangThaiHoatDong() != TrangThaiHoatDong.HIEN_HANH) {
            throw new IllegalArgumentException(
                    "Không thể tạo bến cảng: cảng biển cha phải ở trạng thái hoạt động (HIEN_HANH)");
        }

        BenCang entity = BenCang.builder()
                .maBen(request.getMaBen()).tenBen(request.getTenBen())
                .cangBienId(request.getCangBienId()).tuyenDuongThuy(request.getTuyenDuongThuy())
                .viDo(request.getViDo()).kinhDo(request.getKinhDo())
                .chieuDai(request.getChieuDai()).chieuRong(request.getChieuRong())
                .loaiBen(request.getLoaiBen()).doSauLuong(request.getDoSauLuong())
                .congNangKhaiThac(request.getCongNangKhaiThac())
                .trangThaiHoatDong(request.getTrangThaiHoatDong())
                .orgUnitId(parent.getOrgUnitId())
                .trangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .bieuTuongId(request.getBieuTuongId())
                // Extended fields
                .diaDiem(request.getDiaDiem())
                .diaDiemChiTiet(request.getDiaDiemChiTiet())
                .heQuyChieu(request.getHeQuyChieu())
                .quyTacHienThi(request.getQuyTacHienThi())
                .donViKhaiThac(request.getDonViKhaiThac())
                .tongDienTich(request.getTongDienTich())
                .nangLucThongQuaThietKe(request.getNangLucThongQuaThietKe())
                .nangLucThongQuaHienTrang(request.getNangLucThongQuaHienTrang())
                .coTauTiepNhanLonNhat(request.getCoTauTiepNhanLonNhat())
                .quyHoachNangLucThongQua(request.getQuyHoachNangLucThongQua())
                .sanLuongHangHoaNamGanNhat(request.getSanLuongHangHoaNamGanNhat())
                .thoiDiemCongBoMo(request.getThoiDiemCongBoMo())
                .quyetDinhCongBo(request.getQuyetDinhCongBo())
                .vanBanThoaThuanDauTu(request.getVanBanThoaThuanDauTu())
                .loaiKetCau(request.getLoaiKetCau())
                .build();
        BenCang saved = benCangRepository.save(entity);

        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getTenBen(),
                    "BENCANG_" + saved.getMaBen(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.BENCANG
            );
            saved.setKhongGianId(spatialObj.getId());
            if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) {
                try {
                    String clean = toaDo.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        saved.setKinhDo(new java.math.BigDecimal(parts[0]));
                        saved.setViDo(new java.math.BigDecimal(parts[1]));
                    }
                } catch (Exception e) {
                    log.error("Failed to parse POINT coordinates", e);
                }
            }
            saved = benCangRepository.save(saved);
        }

        log.info("Created BenCang [{}] code={}", saved.getId(), saved.getMaBen());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BenCangResponse getById(UUID id) {
        return toResponse(benCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<BenCangResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<BenCangResponse> findAll(int page, int size, UUID orgUnitId,
            String maBen, String tenBen, UUID cangBienId,
            String tuyenDuongThuy, String loaiBen,
            String trangThaiHoatDong, String trangThaiPheDuyet, String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        TrangThaiHoatDong statusEnum = trangThaiHoatDong != null ? TrangThaiHoatDong.fromString(trangThaiHoatDong)
                : null;
        TrangThaiPheDuyet approvalEnum = trangThaiPheDuyet != null ? TrangThaiPheDuyet.fromString(trangThaiPheDuyet)
                : null;
        com.hanghai.kchtg.cangben.entity.LoaiBen loaiBenEnum = null;
        if (loaiBen != null && !loaiBen.trim().isEmpty()) {
            try {
                loaiBenEnum = com.hanghai.kchtg.cangben.entity.LoaiBen.valueOf(loaiBen.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore or leave as null if invalid enum string
            }
        }
        Page<BenCang> pageResult = benCangRepository.searchBenCang(orgUnitId, search, maBen, tenBen, cangBienId,
                tuyenDuongThuy, loaiBenEnum, statusEnum, approvalEnum, pageable);

        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(BenCang::getCangBienId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            cangBienRepository.findAllById(parentIds).forEach(cb -> {
                parentNameMap.put(cb.getId(), cb.getTenCang());
            });
        }

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        pageResult.getContent().forEach(e -> {
            try {
                if (e.getCreatedBy() != null) userUuids.add(UUID.fromString(e.getCreatedBy()));
                if (e.getUpdatedBy() != null) userUuids.add(UUID.fromString(e.getUpdatedBy()));
            } catch (Exception ex) {
                // ignore
            }
        });

        java.util.Map<String, String> userNamesMap = new java.util.HashMap<>();
        if (!userUuids.isEmpty()) {
            userRepository.findAllById(userUuids).forEach(usr -> {
                String displayName = usr.getFullName() != null && !usr.getFullName().trim().isEmpty()
                        ? usr.getFullName()
                        : usr.getUsername();
                userNamesMap.put(usr.getId().toString(), displayName);
            });
        }

        return pageResult.map(e -> toResponse(e, 
                parentNameMap.get(e.getCangBienId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy())
        ));
    }

    @Transactional(readOnly = true)
    public BenCangResponse findByCode(String maBen) {
        return toResponse(benCangRepository.findByMaBen(maBen)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với mã: " + maBen)));
    }

    /**
     * Find all active BenCang by parent CangBien ID.
     */
    @Transactional(readOnly = true)
    public List<BenCang> findByCangBienId(UUID cangBienId) {
        return benCangRepository.findByCangBienIdAndDeletedAtIsNull(cangBienId);
    }

    @Transactional
    public BenCangResponse update(UpdateBenCangRequest request) {
        BenCang entity = benCangRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + request.getId()));

        // Capture pre-mutation snapshot BEFORE applying changes (INT-003c fix)
        BenCang snapshot = BenCang.builder()
                .maBen(entity.getMaBen())
                .tenBen(entity.getTenBen()).cangBienId(entity.getCangBienId())
                .tuyenDuongThuy(entity.getTuyenDuongThuy()).viDo(entity.getViDo())
                .kinhDo(entity.getKinhDo()).chieuDai(entity.getChieuDai())
                .chieuRong(entity.getChieuRong()).loaiBen(entity.getLoaiBen())
                .doSauLuong(entity.getDoSauLuong()).congNangKhaiThac(entity.getCongNangKhaiThac())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .orgUnitId(entity.getOrgUnitId())
                .bieuTuongId(entity.getBieuTuongId())
                // Extended fields snapshot
                .diaDiem(entity.getDiaDiem())
                .diaDiemChiTiet(entity.getDiaDiemChiTiet())
                .heQuyChieu(entity.getHeQuyChieu())
                .quyTacHienThi(entity.getQuyTacHienThi())
                .donViKhaiThac(entity.getDonViKhaiThac())
                .tongDienTich(entity.getTongDienTich())
                .nangLucThongQuaThietKe(entity.getNangLucThongQuaThietKe())
                .nangLucThongQuaHienTrang(entity.getNangLucThongQuaHienTrang())
                .coTauTiepNhanLonNhat(entity.getCoTauTiepNhanLonNhat())
                .quyHoachNangLucThongQua(entity.getQuyHoachNangLucThongQua())
                .sanLuongHangHoaNamGanNhat(entity.getSanLuongHangHoaNamGanNhat())
                .thoiDiemCongBoMo(entity.getThoiDiemCongBoMo())
                .quyetDinhCongBo(entity.getQuyetDinhCongBo())
                .vanBanThoaThuanDauTu(entity.getVanBanThoaThuanDauTu())
                .loaiKetCau(entity.getLoaiKetCau())
                .build();

        if (request.getTenBen() != null)
            entity.setTenBen(request.getTenBen());
        if (request.getCangBienId() != null) {
            entity.setCangBienId(request.getCangBienId());
            CangBien parent = cangBienRepository.findById(request.getCangBienId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getCangBienId()));
            entity.setOrgUnitId(parent.getOrgUnitId());
            
            // Cascade update all CauCang children
            cauCangRepository.findByBenCangIdAndDeletedAtIsNull(entity.getId()).forEach(cc -> {
                cc.setDonViId(parent.getOrgUnitId());
                cauCangRepository.save(cc);
            });
        } else if (entity.getOrgUnitId() == null && entity.getCangBienId() != null) {
            cangBienRepository.findById(entity.getCangBienId()).ifPresent(p -> {
                entity.setOrgUnitId(p.getOrgUnitId());
                
                // Cascade update all CauCang children
                cauCangRepository.findByBenCangIdAndDeletedAtIsNull(entity.getId()).forEach(cc -> {
                    cc.setDonViId(p.getOrgUnitId());
                    cauCangRepository.save(cc);
                });
            });
        }
        if (request.getTuyenDuongThuy() != null)
            entity.setTuyenDuongThuy(request.getTuyenDuongThuy());
        if (request.getViDo() != null)
            entity.setViDo(request.getViDo());
        if (request.getKinhDo() != null)
            entity.setKinhDo(request.getKinhDo());
        if (request.getChieuDai() != null)
            entity.setChieuDai(request.getChieuDai());
        if (request.getChieuRong() != null)
            entity.setChieuRong(request.getChieuRong());
        if (request.getLoaiBen() != null)
            entity.setLoaiBen(request.getLoaiBen());
        if (request.getDoSauLuong() != null)
            entity.setDoSauLuong(request.getDoSauLuong());
        if (request.getCongNangKhaiThac() != null)
            entity.setCongNangKhaiThac(request.getCongNangKhaiThac());
        if (request.getTrangThaiHoatDong() != null)
            entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        // Extended fields
        if (request.getDiaDiem() != null)
            entity.setDiaDiem(request.getDiaDiem());
        if (request.getDiaDiemChiTiet() != null)
            entity.setDiaDiemChiTiet(request.getDiaDiemChiTiet());
        if (request.getHeQuyChieu() != null)
            entity.setHeQuyChieu(request.getHeQuyChieu());
        if (request.getQuyTacHienThi() != null)
            entity.setQuyTacHienThi(request.getQuyTacHienThi());
        if (request.getDonViKhaiThac() != null)
            entity.setDonViKhaiThac(request.getDonViKhaiThac());
        if (request.getTongDienTich() != null)
            entity.setTongDienTich(request.getTongDienTich());
        if (request.getNangLucThongQuaThietKe() != null)
            entity.setNangLucThongQuaThietKe(request.getNangLucThongQuaThietKe());
        if (request.getNangLucThongQuaHienTrang() != null)
            entity.setNangLucThongQuaHienTrang(request.getNangLucThongQuaHienTrang());
        if (request.getCoTauTiepNhanLonNhat() != null)
            entity.setCoTauTiepNhanLonNhat(request.getCoTauTiepNhanLonNhat());
        if (request.getQuyHoachNangLucThongQua() != null)
            entity.setQuyHoachNangLucThongQua(request.getQuyHoachNangLucThongQua());
        if (request.getSanLuongHangHoaNamGanNhat() != null)
            entity.setSanLuongHangHoaNamGanNhat(request.getSanLuongHangHoaNamGanNhat());
        if (request.getThoiDiemCongBoMo() != null)
            entity.setThoiDiemCongBoMo(request.getThoiDiemCongBoMo());
        if (request.getQuyetDinhCongBo() != null)
            entity.setQuyetDinhCongBo(request.getQuyetDinhCongBo());
        if (request.getVanBanThoaThuanDauTu() != null)
            entity.setVanBanThoaThuanDauTu(request.getVanBanThoaThuanDauTu());
        if (request.getLoaiKetCau() != null)
            entity.setLoaiKetCau(request.getLoaiKetCau());
        entity.setBieuTuongId(request.getBieuTuongId());
        entity.setTrangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET);

        BenCang saved = benCangRepository.save(entity);

        // Sync to GisSpatialObject
        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getTenBen(),
                    "BENCANG_" + saved.getMaBen(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.BENCANG
            );
            saved.setKhongGianId(spatialObj.getId());
            if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) {
                try {
                    String clean = toaDo.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        saved.setKinhDo(new java.math.BigDecimal(parts[0]));
                        saved.setViDo(new java.math.BigDecimal(parts[1]));
                    }
                } catch (Exception e) {
                    log.error("Failed to parse POINT coordinates", e);
                }
            }
            saved = benCangRepository.save(saved);
        } else if (saved.getKhongGianId() != null) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getTenBen(),
                    "BENCANG_" + saved.getMaBen(),
                    geomType,
                    objType,
                    "POINT(" + saved.getKinhDo() + " " + saved.getViDo() + ")",
                    saved.getBieuTuongId(),
                    saved.getId(),
                    com.hanghai.kchtg.gis.search.dto.KchtType.BENCANG
            );
        }

        // Record change history using pre-mutation snapshot (INT-003b/c)
        lichSuThayDoiService.recordChanges("BenCang", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated BenCang [{}] code={}", saved.getId(), saved.getMaBen());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        BenCang entity = benCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));
        // CauCang child check would use CauCangRepository — deferred to W3
        entity.softDelete();
        benCangRepository.save(entity);
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }
        log.info("Soft-deleted BenCang [{}] code={}", entity.getId(), entity.getMaBen());
    }

    private BenCangResponse toResponse(BenCang e) {
        return toResponse(e, null, null, null);
    }

    private BenCangResponse toResponse(BenCang e, String preResolvedTenCangBien) {
        return toResponse(e, preResolvedTenCangBien, null, null);
    }

    private BenCangResponse toResponse(BenCang e, String preResolvedTenCangBien, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String tenCangBien = preResolvedTenCangBien;
        if (tenCangBien == null && e.getCangBienId() != null) {
            tenCangBien = cangBienRepository.findById(e.getCangBienId()).map(CangBien::getTenCang).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        BenCangResponse.BenCangResponseBuilder builder = BenCangResponse.builder()
                .id(e.getId()).maBen(e.getMaBen()).tenBen(e.getTenBen())
                .cangBienId(e.getCangBienId())
                .tenCangBien(tenCangBien)
                .tuyenDuongThuy(e.getTuyenDuongThuy())
                .viDo(e.getViDo()).kinhDo(e.getKinhDo()).chieuDai(e.getChieuDai())
                .chieuRong(e.getChieuRong()).loaiBen(e.getLoaiBen())
                .doSauLuong(e.getDoSauLuong()).congNangKhaiThac(e.getCongNangKhaiThac())
                .trangThaiHoatDong(e.getTrangThaiHoatDong())
                .trangThaiPheDuyet(e.getTrangThaiPheDuyet()).orgUnitId(e.getOrgUnitId())
                .bieuTuongId(e.getBieuTuongId())
                // Extended fields
                .diaDiem(e.getDiaDiem())
                .diaDiemChiTiet(e.getDiaDiemChiTiet())
                .heQuyChieu(e.getHeQuyChieu())
                .quyTacHienThi(e.getQuyTacHienThi())
                .donViKhaiThac(e.getDonViKhaiThac())
                .tongDienTich(e.getTongDienTich())
                .nangLucThongQuaThietKe(e.getNangLucThongQuaThietKe())
                .nangLucThongQuaHienTrang(e.getNangLucThongQuaHienTrang())
                .coTauTiepNhanLonNhat(e.getCoTauTiepNhanLonNhat())
                .quyHoachNangLucThongQua(e.getQuyHoachNangLucThongQua())
                .sanLuongHangHoaNamGanNhat(e.getSanLuongHangHoaNamGanNhat())
                .thoiDiemCongBoMo(e.getThoiDiemCongBoMo())
                .quyetDinhCongBo(e.getQuyetDinhCongBo())
                .vanBanThoaThuanDauTu(e.getVanBanThoaThuanDauTu())
                .loaiKetCau(e.getLoaiKetCau())
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt());

        if (e.getKhongGianId() != null) {
            builder.khongGianId(e.getKhongGianId());
            gisSpatialObjectService.findById(e.getKhongGianId()).ifPresent(spatialObj -> {
                builder.loaiHinhHoc(spatialObj.getGeometryType());
                builder.toaDo(spatialObj.getCoordinates());
            });
        }
        return builder.build();
    }
}
