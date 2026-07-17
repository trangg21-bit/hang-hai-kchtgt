package com.hanghai.kchtg.tramradar.service;

import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.entity.*;
import com.hanghai.kchtg.tramradar.repository.PheDuyetLichSuRepository;
import com.hanghai.kchtg.tramradar.repository.TramRadarRepository;
import com.hanghai.kchtg.vts.repository.HeThongVTSRepository;
import com.hanghai.kchtg.vts.entity.HeThongVTS;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TramRadarService {

    private final TramRadarRepository repository;
    private final PheDuyetLichSuRepository historyRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;
    private final HeThongVTSRepository heThongVTSRepository;

    public TramRadarResponse create(TramRadarCreateRequest request, String createdBy) {
        TramRadar entity = TramRadar.builder()
                .tenTram(request.getTenTram())
                .viTri(request.getViTri())
                .kinhDo(request.getKinhDo())
                .viDo(request.getViDo())
                .loaiTram(request.getLoaiTram())
                .coTrinh(request.getCoTrinh())
                .dienTichPhaXa(request.getDienTichPhaXa())
                .nguonGoc(request.getNguonGoc())
                .tinhTrang(request.getTinhTrang())
                .orgUnitId(request.getOrgUnitId())
                .heThongVtsId(request.getHeThongVtsId())
                .chieuCaoThapRadar(request.getChieuCaoThapRadar())
                .tamHieuLucRadar(request.getTamHieuLucRadar())
                .trangThai(TramRadarApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao(createdBy)
                .build();

        TramRadar saved = repository.save(entity);

        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_OTHER;
            UUID refId = UUID.nameUUIDFromBytes(String.valueOf(saved.getId()).getBytes());
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getTenTram(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.TRAM_RADAR
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
                    // ignore
                }
            }
            saved = repository.save(saved);
        }

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(0)
                .trangThai("CREATE")
                .nguoiPheDuyet(createdBy)
                .lyDo("Tạo mới trạm radar")
                .build());

        return toResponse(saved);
    }

    public TramRadarResponse getById(Long id) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        if (entity.getIsDeleted()) {
            throw new RuntimeException("Trạm Radar đã bị xóa với ID: " + id);
        }
        return toResponse(entity);
    }

    public List<TramRadarResponse> findAll(int page, int size) {
        return repository.findByTrangThaiAndIsDeletedFalse(TramRadarApprovalStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    public TramRadarResponse update(Long id, TramRadarUpdateRequest request, String updatedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getIsDeleted()) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        if (entity.getTrangThai() == TramRadarApprovalStatus.APPROVED) {
            entity.setTrangThai(TramRadarApprovalStatus.UNDER_REVIEW);
        }

        if (request.getTenTram() != null) entity.setTenTram(request.getTenTram());
        if (request.getViTri() != null) entity.setViTri(request.getViTri());
        if (request.getKinhDo() != null) entity.setKinhDo(request.getKinhDo());
        if (request.getViDo() != null) entity.setViDo(request.getViDo());
        if (request.getLoaiTram() != null) entity.setLoaiTram(request.getLoaiTram());
        if (request.getCoTrinh() != null) entity.setCoTrinh(request.getCoTrinh());
        if (request.getDienTichPhaXa() != null) entity.setDienTichPhaXa(request.getDienTichPhaXa());
        if (request.getNguonGoc() != null) entity.setNguonGoc(request.getNguonGoc());
        if (request.getTinhTrang() != null) entity.setTinhTrang(request.getTinhTrang());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
        if (request.getHeThongVtsId() != null) entity.setHeThongVtsId(request.getHeThongVtsId());
        if (request.getChieuCaoThapRadar() != null) entity.setChieuCaoThapRadar(request.getChieuCaoThapRadar());
        if (request.getTamHieuLucRadar() != null) entity.setTamHieuLucRadar(request.getTamHieuLucRadar());

        TramRadar saved = repository.save(entity);

        // Sync to GisSpatialObject
        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_OTHER;
            UUID refId = UUID.nameUUIDFromBytes(String.valueOf(saved.getId()).getBytes());
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getTenTram(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.TRAM_RADAR
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
                    // ignore
                }
            }
            saved = repository.save(saved);
        } else if (saved.getKhongGianId() != null) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_OTHER;
            gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getTenTram(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    "POINT(" + saved.getKinhDo() + " " + saved.getViDo() + ")",
                    request.getBieuTuongId(),
                    UUID.nameUUIDFromBytes(String.valueOf(saved.getId()).getBytes()),
                    com.hanghai.kchtg.gis.search.dto.KchtType.TRAM_RADAR
            );
        }

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(0)
                .trangThai("UPDATE")
                .nguoiPheDuyet(updatedBy)
                .lyDo("Cập nhật thông tin trạm radar")
                .build());

        return toResponse(saved);
    }

    public void delete(Long id, String deletedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getTrangThai() != TramRadarApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED) với ID: " + id);
        }

        entity.setIsDeleted(true);
        repository.save(entity);
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(entity.getId())
                .capPheDuyet(0)
                .trangThai("DELETE")
                .nguoiPheDuyet(deletedBy)
                .lyDo("Xóa trạm radar")
                .build());
    }

    public TramRadarResponse approveC1(Long id, PheDuyetRequest request, String approvedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getTrangThai() != TramRadarApprovalStatus.PROPOSED) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Chờ duyệt (PROPOSED) với ID: " + id);
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setTrangThai(TramRadarApprovalStatus.REJECTED);
            entity.setLyDoTuChoi(request.getLyDo());
        } else {
            entity.setTrangThai(TramRadarApprovalStatus.UNDER_REVIEW);
            entity.setPheDuyetC1(true);
            entity.setNguoiPheDuyetC1(approvedBy);
            entity.setNgayPheDuyetC1(LocalDateTime.now());
        }

        TramRadar saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(1)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(approvedBy)
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public TramRadarResponse approveC2(Long id, PheDuyetRequest request, String approvedBy) {
        TramRadar entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getTrangThai() != TramRadarApprovalStatus.UNDER_REVIEW) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Đang xem xét (UNDER_REVIEW) với ID: " + id);
        }

        String c1Actor = entity.getNguoiPheDuyetC1();
        if (c1Actor != null && c1Actor.equals(approvedBy) && !"admin".equals(approvedBy)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setTrangThai(TramRadarApprovalStatus.REJECTED);
            entity.setLyDoTuChoi(request.getLyDo());
        } else {
            entity.setTrangThai(TramRadarApprovalStatus.APPROVED);
            entity.setPheDuyetC2(true);
            entity.setNguoiPheDuyetC2(approvedBy);
            entity.setNgayPheDuyetC2(LocalDateTime.now());
        }

        TramRadar saved = repository.save(entity);

        historyRepository.save(PheDuyetLichSu.builder()
                .tramRadarId(saved.getId())
                .capPheDuyet(2)
                .trangThai(request.getQuyetDinh())
                .nguoiPheDuyet(approvedBy)
                .lyDo(request.getLyDo())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(Long tramRadarId) {
        return historyRepository.findByTramRadarIdOrderByNgayPheDuyetDesc(tramRadarId)
                .stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .capPheDuyet(h.getCapPheDuyet())
                        .trangThai(h.getTrangThai())
                        .nguoiPheDuyet(h.getNguoiPheDuyet())
                        .ngayPheDuyet(h.getNgayPheDuyet())
                        .lyDo(h.getLyDo())
                        .build()).toList();
    }

    public List<TramRadarResponse> search(UUID orgUnitId, String keyword, String tinhTrang, String trangThai) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        TramRadarApprovalStatus statusEnum = (trangThai != null && !trangThai.trim().isEmpty()) ? TramRadarApprovalStatus.fromString(trangThai) : null;
        return repository.search(orgUnitId, keywordLike, tinhTrang, statusEnum, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toResponse)
                .toList();
    }

    private TramRadarResponse toResponse(TramRadar entity) {
        List<TramRadarAttachmentResponse> attachments = entity.getAttachments().stream()
                .map(a -> TramRadarAttachmentResponse.builder()
                        .id(a.getId())
                        .tenTaiLieu(a.getTenTaiLieu())
                        .duongDan(a.getDuongDan())
                        .kichThuoc(a.getKichThuoc())
                        .loaiTaiLieu(a.getLoaiTaiLieu())
                        .nguoiTaiLen(a.getNguoiTaiLen())
                        .ngayTaiLen(a.getNgayTaiLen())
                        .build()).toList();

        TramRadarResponse.TramRadarResponseBuilder builder = TramRadarResponse.builder()
                .id(entity.getId())
                .tenTram(entity.getTenTram())
                .viTri(entity.getViTri())
                .kinhDo(entity.getKinhDo())
                .viDo(entity.getViDo())
                .loaiTram(entity.getLoaiTram())
                .coTrinh(entity.getCoTrinh())
                .dienTichPhaXa(entity.getDienTichPhaXa())
                .nguonGoc(entity.getNguonGoc())
                .tinhTrang(entity.getTinhTrang())
                .orgUnitId(entity.getOrgUnitId())
                .trangThai(entity.getTrangThai())
                .pheDuyetC1(entity.getPheDuyetC1())
                .nguoiPheDuyetC1(entity.getNguoiPheDuyetC1())
                .ngayPheDuyetC1(entity.getNgayPheDuyetC1())
                .pheDuyetC2(entity.getPheDuyetC2())
                .nguoiPheDuyetC2(entity.getNguoiPheDuyetC2())
                .ngayPheDuyetC2(entity.getNgayPheDuyetC2())
                .lyDoTuChoi(entity.getLyDoTuChoi())
                .nguoiTao(entity.getNguoiTao())
                .ngayTao(entity.getNgayTao())
                .nguoiSuaDoi(entity.getNguoiSuaDoi())
                .ngaySuaDoi(entity.getNgaySuaDoi())
                .attachments(attachments)
                .heThongVtsId(entity.getHeThongVtsId())
                .chieuCaoThapRadar(entity.getChieuCaoThapRadar())
                .tamHieuLucRadar(entity.getTamHieuLucRadar())
                .tenHeThongVts(entity.getHeThongVtsId() != null ? 
                    heThongVTSRepository.findById(entity.getHeThongVtsId())
                        .map(HeThongVTS::getTenHeThong)
                        .orElse("") : "");

        if (entity.getKhongGianId() != null) {
            builder.khongGianId(entity.getKhongGianId());
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                builder.loaiHinhHoc(spatialObj.getGeometryType());
                builder.toaDo(spatialObj.getCoordinates());
                builder.bieuTuongId(spatialObj.getBieuTuongId());
            });
        }
        return builder.build();
    }
}