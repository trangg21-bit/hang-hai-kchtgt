package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.cangben.entity.*;
import com.hanghai.kchtg.cangben.repository.*;
import com.hanghai.kchtg.deke.entity.DeKe;
import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import com.hanghai.kchtg.deke.repository.DeKeRepository;
import com.hanghai.kchtg.cosuachua.entity.CoSuaChuaDongTau;
import com.hanghai.kchtg.cosuachua.repository.CoSuaChuaDongTauRepository;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHai;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramPhaoRepository;
import com.hanghai.kchtg.vts.entity.HeThongVTS;
import com.hanghai.kchtg.vts.repository.HeThongVTSRepository;
import com.hanghai.kchtg.tramradar.entity.TramRadar;
import com.hanghai.kchtg.tramradar.repository.TramRadarRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchResult;
import com.hanghai.kchtg.gis.search.dto.KchtType;
import com.hanghai.kchtg.gis.search.dto.TinhThanhPho;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KchtGis155Service {

    private final CangBienRepository cangBienRepository;
    private final BenCangRepository benCangRepository;
    private final CauCangRepository cauCangRepository;
    private final CangCanRepository cangCanRepository;
    private final VungNuocRepository vungNuocRepository;
    private final LuongHangHaiRepository luongHangHaiRepository;
    private final DeKeRepository deKeRepository;
    private final CoSuaChuaDongTauRepository coSuaChuaDongTauRepository;
    private final NhaTramDenRepository nhaTramDenRepository;
    private final NhaTramPhaoRepository nhaTramPhaoRepository;
    private final HeThongVTSRepository heThongVTSRepository;
    private final TramRadarRepository tramRadarRepository;
    private final OrgUnitRepository orgUnitRepository;

    private String getOrgName(UUID orgUnitId) {
        if (orgUnitId == null) {
            return "Cục Hàng hải Việt Nam";
        }
        return orgUnitRepository.findById(orgUnitId)
                .map(OrgUnit::getName)
                .orElse("Cục Hàng hải Việt Nam");
    }

    public Page<KchtGisSearchResult> search(
            UUID orgUnitId,
            List<KchtType> kchtTypes,
            TinhThanhPho tinhThanhPho,
            String search,
            GisObjectType objectType,
            int page,
            int size) {

        List<KchtGisSearchResult> results = new ArrayList<>();
        List<KchtType> types = (kchtTypes == null || kchtTypes.isEmpty()) ? Arrays.asList(KchtType.values())
                : kchtTypes;
        String searchLower = (search == null || search.trim().isEmpty()) ? null : search.toLowerCase().trim();
        String tinhThanhStr = (tinhThanhPho != null) ? tinhThanhPho.getDisplayName() : null;

        boolean isRootOrg = false;
        if (orgUnitId == null) {
            isRootOrg = true;
        } else {
            String orgName = orgUnitRepository.findById(orgUnitId)
                    .map(OrgUnit::getName)
                    .orElse("");
            if (orgName.contains("Cục Hàng hải Việt Nam")) {
                isRootOrg = true;
            }
        }

        for (KchtType type : types) {
            // Filter by geometry compatibility if objectType is set
            if (objectType != null) {
                boolean isPointType = (type == KchtType.CANGBIEN || type == KchtType.BENCANG || type == KchtType.CAUCANG
                        ||
                        type == KchtType.CANGCAN || type == KchtType.DENBIEN || type == KchtType.PHAOTIEU ||
                        type == KchtType.TRAM_RADAR || type == KchtType.HE_THONG_VTS || type == KchtType.COSO_SUACHUA);
                boolean isLineType = (type == KchtType.LUONGHANGHAI || type == KchtType.DEKE);
                boolean isPolygonType = (type == KchtType.VUNGNUOC || type == KchtType.BENPHAO
                        || type == KchtType.KHUNEO_DAU ||
                        type == KchtType.KHUCHUYEN_TAI || type == KchtType.KHUTRANH_TRU_BAO);

                if (objectType == GisObjectType.POINT && !isPointType)
                    continue;
                if (objectType == GisObjectType.LINE && !isLineType)
                    continue;
                if (objectType == GisObjectType.POLYGON && !isPolygonType)
                    continue;
            }

            switch (type) {
                case CANGBIEN:
                    List<CangBien> cangBiens = cangBienRepository.searchCangBien(
                            orgUnitId, null, null, tinhThanhStr, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, searchLower, PageRequest.of(0, 10000)).getContent();
                    for (CangBien cb : cangBiens) {
                        results.add(KchtGisSearchResult.builder()
                                .id(cb.getId())
                                .name(cb.getTenCang())
                                .ma(cb.getMaCang())
                                .orgName(getOrgName(cb.getOrgUnitId()))
                                .kchtTypeLabel("Cảng biển")
                                .diaDiem(cb.getTinhThanhPho() != null ? cb.getTinhThanhPho() : "")
                                .diaChiChiTiet("")
                                .latitude(cb.getViDo() != null ? cb.getViDo().doubleValue() : null)
                                .longitude(cb.getKinhDo() != null ? cb.getKinhDo().doubleValue() : null)
                                .bieuTuongId(cb.getBieuTuongId())
                                .build());
                    }
                    break;

                case BENCANG:
                    List<BenCang> benCangs = benCangRepository.searchBenCang(
                            orgUnitId, null, searchLower, null, null, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (BenCang bc : benCangs) {
                        CangBien parent = (bc.getCangBienId() != null)
                                ? cangBienRepository.findById(bc.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        results.add(KchtGisSearchResult.builder()
                                .id(bc.getId())
                                .name(bc.getTenBen())
                                .ma(bc.getMaBen())
                                .orgName(getOrgName(bc.getOrgUnitId()))
                                .kchtTypeLabel("Bến cảng")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(bc.getTuyenDuongThuy() != null ? bc.getTuyenDuongThuy() : "")
                                .latitude(bc.getViDo() != null ? bc.getViDo().doubleValue() : null)
                                .longitude(bc.getKinhDo() != null ? bc.getKinhDo().doubleValue() : null)
                                .bieuTuongId(bc.getBieuTuongId())
                                .build());
                    }
                    break;

                case CAUCANG:
                    List<CauCang> cauCangs = cauCangRepository.searchCauCang(
                            orgUnitId, searchLower, null, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (CauCang cc : cauCangs) {
                        BenCang parentBen = (cc.getBenCangId() != null)
                                ? benCangRepository.findById(cc.getBenCangId()).orElse(null)
                                : null;
                        CangBien parentCb = (parentBen != null && parentBen.getCangBienId() != null)
                                ? cangBienRepository.findById(parentBen.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parentCb != null && parentCb.getTinhThanhPho() != null)
                                ? parentCb.getTinhThanhPho()
                                : "";
                        Double viDo = (parentBen != null && parentBen.getViDo() != null)
                                ? parentBen.getViDo().doubleValue()
                                : null;
                        Double kinhDo = (parentBen != null && parentBen.getKinhDo() != null)
                                ? parentBen.getKinhDo().doubleValue()
                                : null;

                        results.add(KchtGisSearchResult.builder()
                                .id(cc.getId())
                                .name(cc.getTenCau())
                                .ma(cc.getMaCau())
                                .orgName(getOrgName(cc.getOrgUnitId()))
                                .kchtTypeLabel("Cầu cảng")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(cc.getLoaiCau() != null ? cc.getLoaiCau().name() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(cc.getBieuTuongId())
                                .build());
                    }
                    break;

                case CANGCAN:
                    List<CangCan> cangCans = cangCanRepository.searchCangCan(
                            orgUnitId, searchLower, TrangThaiHoatDong.HIEN_HANH, TrangThaiPheDuyet.DUOC_PHE_DUYET,
                            PageRequest.of(0, 10000)).getContent();
                    for (CangCan cc : cangCans) {
                        results.add(KchtGisSearchResult.builder()
                                .id(cc.getId())
                                .name(cc.getTenCangCan())
                                .ma(cc.getMaCangCan())
                                .orgName(getOrgName(cc.getOrgUnitId()))
                                .kchtTypeLabel("Cảng cạn")
                                .diaDiem(cc.getTinhThanhPho() != null ? cc.getTinhThanhPho() : "")
                                .diaChiChiTiet("")
                                .latitude(cc.getViDo() != null ? cc.getViDo().doubleValue() : null)
                                .longitude(cc.getKinhDo() != null ? cc.getKinhDo().doubleValue() : null)
                                .bieuTuongId(cc.getBieuTuongId())
                                .build());
                    }
                    break;

                case VUNGNUOC:
                    List<VungNuoc> vungNuocs = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (VungNuoc vn : vungNuocs) {
                        CangBien parent = (vn.getCangBienId() != null)
                                ? cangBienRepository.findById(vn.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        Double viDo = null;
                        Double kinhDo = null;

                        results.add(KchtGisSearchResult.builder()
                                .id(vn.getId())
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getOrgUnitId()))
                                .kchtTypeLabel("Vùng nước")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet("")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build());
                    }
                    break;

                case LUONGHANGHAI:
                    List<LuongHangHai> luongList = luongHangHaiRepository.findAll().stream()
                            .filter(x -> !Boolean.TRUE.equals(x.getIsDeleted()))
                            .filter(x -> orgUnitId == null || orgUnitId.equals(x.getOrgUnitId()))
                            .filter(x -> searchLower == null ||
                                    (x.getLoaiTau() != null && x.getLoaiTau().toLowerCase().contains(searchLower)))
                            .collect(Collectors.toList());
                    for (LuongHangHai l : luongList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(UUID.nameUUIDFromBytes(String.valueOf(l.getId()).getBytes()))
                                .name("Luồng hàng hải " + l.getId() + " - " + l.getLoaiTau())
                                .ma("LUONG_" + l.getId())
                                .orgName(getOrgName(l.getOrgUnitId()))
                                .kchtTypeLabel("Luồng hàng hải")
                                .diaDiem("")
                                .diaChiChiTiet(l.getGhiChu() != null ? l.getGhiChu() : "")
                                .latitude(null)
                                .longitude(null)
                                .build());
                    }
                    break;
 
                case DEKE:
                    List<DeKe> deKeList = deKeRepository.searchDocuments(
                            orgUnitId, searchLower, null, null, DeKeApprovalStatus.APPROVED, PageRequest.of(0, 10000))
                            .getContent();
                    for (DeKe dk : deKeList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(UUID.nameUUIDFromBytes(String.valueOf(dk.getId()).getBytes()))
                                .name("Đê kè " + dk.getId() + " - " + dk.getLoaiDe())
                                .ma("DEKE_" + dk.getId())
                                .orgName(getOrgName(dk.getOrgUnitId()))
                                .kchtTypeLabel("Đê kè")
                                .diaDiem("")
                                .diaChiChiTiet(dk.getViTri() != null ? dk.getViTri() : "")
                                .latitude(null)
                                .longitude(null)
                                .build());
                    }
                    break;
 
                case COSO_SUACHUA:
                    List<CoSuaChuaDongTau> csList = coSuaChuaDongTauRepository.findAll().stream()
                            .filter(x -> !Boolean.TRUE.equals(x.getIsDeleted()))
                            .filter(x -> orgUnitId == null || orgUnitId.equals(x.getOrgUnitId()))
                            .filter(x -> searchLower == null ||
                                    (x.getTenCoSo() != null && x.getTenCoSo().toLowerCase().contains(searchLower)) ||
                                    (x.getDiaChi() != null && x.getDiaChi().toLowerCase().contains(searchLower)))
                            .collect(Collectors.toList());
                    for (CoSuaChuaDongTau cs : csList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(UUID.nameUUIDFromBytes(String.valueOf(cs.getId()).getBytes()))
                                .name(cs.getTenCoSo())
                                .ma("COSO_" + cs.getId())
                                .orgName(getOrgName(cs.getOrgUnitId()))
                                .kchtTypeLabel("Cơ sở sửa chữa")
                                .diaDiem(cs.getTinhThanh() != null ? cs.getTinhThanh() : "")
                                .diaChiChiTiet(cs.getDiaChi() != null ? cs.getDiaChi() : "")
                                .latitude(null)
                                .longitude(null)
                                .build());
                    }
                    break;

                case DENBIEN:
                    List<NhaTramDen> denList = nhaTramDenRepository.findAll().stream()
                            .filter(x -> x.getDeletedAt() == null)
                            .filter(x -> orgUnitId == null || orgUnitId.equals(x.getUnitId()))
                            .filter(x -> searchLower == null ||
                                    (x.getName() != null && x.getName().toLowerCase().contains(searchLower)) ||
                                    (x.getCode() != null && x.getCode().toLowerCase().contains(searchLower)))
                            .collect(Collectors.toList());
                    for (NhaTramDen den : denList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(den.getId())
                                .name(den.getName())
                                .ma(den.getCode())
                                .orgName(getOrgName(den.getUnitId()))
                                .kchtTypeLabel("Đèn biển")
                                .diaDiem("")
                                .diaChiChiTiet(den.getDescription() != null ? den.getDescription() : "")
                                .latitude(den.getLatitude() != null ? den.getLatitude() : null)
                                .longitude(den.getLongitude() != null ? den.getLongitude() : null)
                                .build());
                    }
                    break;

                case PHAOTIEU:
                    List<NhaTramPhao> phaoList = nhaTramPhaoRepository.findAll().stream()
                            .filter(x -> x.getDeletedAt() == null)
                            .filter(x -> orgUnitId == null || orgUnitId.equals(x.getUnitId()))
                            .filter(x -> searchLower == null ||
                                    (x.getName() != null && x.getName().toLowerCase().contains(searchLower)) ||
                                    (x.getCode() != null && x.getCode().toLowerCase().contains(searchLower)))
                            .collect(Collectors.toList());
                    for (NhaTramPhao phao : phaoList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(phao.getId())
                                .name(phao.getName())
                                .ma(phao.getCode())
                                .orgName(getOrgName(phao.getUnitId()))
                                .kchtTypeLabel("Phao tiêu")
                                .diaDiem("")
                                .diaChiChiTiet(phao.getDescription() != null ? phao.getDescription() : "")
                                .latitude(phao.getLatitude() != null ? phao.getLatitude() : null)
                                .longitude(phao.getLongitude() != null ? phao.getLongitude() : null)
                                .build());
                    }
                    break;

                case HE_THONG_VTS:
                    List<HeThongVTS> vtsList = heThongVTSRepository.findAll().stream()
                            .filter(x -> !Boolean.TRUE.equals(x.getIsDeleted()))
                            .filter(x -> orgUnitId == null || orgUnitId.equals(x.getOrgUnitId()))
                            .filter(x -> searchLower == null ||
                                    (x.getTenHeThong() != null && x.getTenHeThong().toLowerCase().contains(searchLower))
                                    ||
                                    (x.getViTri() != null && x.getViTri().toLowerCase().contains(searchLower)))
                            .collect(Collectors.toList());
                    for (HeThongVTS vts : vtsList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(UUID.nameUUIDFromBytes(String.valueOf(vts.getId()).getBytes()))
                                .name(vts.getTenHeThong())
                                .ma("VTS_" + vts.getId())
                                .orgName(getOrgName(vts.getOrgUnitId()))
                                .kchtTypeLabel("Hệ thống VTS")
                                .diaDiem("")
                                .diaChiChiTiet(vts.getViTri() != null ? vts.getViTri() : "")
                                .latitude(null)
                                .longitude(null)
                                .build());
                    }
                    break;

                case TRAM_RADAR:
                    List<TramRadar> radarList = tramRadarRepository.findAll().stream()
                            .filter(x -> !Boolean.TRUE.equals(x.getIsDeleted()))
                            .filter(x -> orgUnitId == null || orgUnitId.equals(x.getOrgUnitId()))
                            .filter(x -> searchLower == null ||
                                    (x.getTenTram() != null && x.getTenTram().toLowerCase().contains(searchLower)) ||
                                    (x.getViTri() != null && x.getViTri().toLowerCase().contains(searchLower)))
                            .collect(Collectors.toList());
                    for (TramRadar tr : radarList) {
                        results.add(KchtGisSearchResult.builder()
                                .id(UUID.nameUUIDFromBytes(String.valueOf(tr.getId()).getBytes()))
                                .name(tr.getTenTram())
                                .ma("RADAR_" + tr.getId())
                                .orgName(getOrgName(tr.getOrgUnitId()))
                                .kchtTypeLabel("Trạm radar")
                                .diaDiem("")
                                .diaChiChiTiet(tr.getViTri() != null ? tr.getViTri() : "")
                                .latitude(tr.getViDo() != null ? tr.getViDo().doubleValue() : null)
                                .longitude(tr.getKinhDo() != null ? tr.getKinhDo().doubleValue() : null)
                                .build());
                    }
                    break;

                case BENPHAO:
                    List<VungNuoc> benPhaos = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.BEN_PHAO, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (VungNuoc vn : benPhaos) {
                        CangBien parent = (vn.getCangBienId() != null)
                                ? cangBienRepository.findById(vn.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        Double viDo = null;
                        Double kinhDo = null;

                        results.add(KchtGisSearchResult.builder()
                                .id(vn.getId())
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getOrgUnitId()))
                                .kchtTypeLabel("Bến phao")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet("")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build());
                    }
                    break;

                case KHUNEO_DAU:
                    List<VungNuoc> khuNeos = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.NEO_DAU, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (VungNuoc vn : khuNeos) {
                        CangBien parent = (vn.getCangBienId() != null)
                                ? cangBienRepository.findById(vn.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        Double viDo = null;
                        Double kinhDo = null;

                        results.add(KchtGisSearchResult.builder()
                                .id(vn.getId())
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getOrgUnitId()))
                                .kchtTypeLabel("Khu neo đậu")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet("")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build());
                    }
                    break;

                case KHUCHUYEN_TAI:
                    List<VungNuoc> khuChuyens = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.CHUYEN_TAI, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (VungNuoc vn : khuChuyens) {
                        CangBien parent = (vn.getCangBienId() != null)
                                ? cangBienRepository.findById(vn.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        Double viDo = null;
                        Double kinhDo = null;

                        results.add(KchtGisSearchResult.builder()
                                .id(vn.getId())
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getOrgUnitId()))
                                .kchtTypeLabel("Khu chuyển tải")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet("")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build());
                    }
                    break;

                case KHUTRANH_TRU_BAO:
                    List<VungNuoc> khuTranhs = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.TRANH_BAO, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    for (VungNuoc vn : khuTranhs) {
                        CangBien parent = (vn.getCangBienId() != null)
                                ? cangBienRepository.findById(vn.getCangBienId()).orElse(null)
                                : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        Double viDo = null;
                        Double kinhDo = null;

                        results.add(KchtGisSearchResult.builder()
                                .id(vn.getId())
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getOrgUnitId()))
                                .kchtTypeLabel("Khu tránh trú bão")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet("")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build());
                    }
                    break;
            }
        }

        // Apply pagination
        int start = Math.min(page * size, results.size());
        int end = Math.min(start + size, results.size());
        List<KchtGisSearchResult> subList = results.subList(start, end);
        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(subList, pageable, results.size());
    }
}
