package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.navigationchannel.entity.*;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.navigationchannel.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.search.dto.KchtType;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for NavigationChannel (F-038 to F-043).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NavigationChannelService {

    private final NavigationChannelRepository repo;
    private final ApprovalHistoryRepository approvalHistoryRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitRepository orgUnitRepository;

    @Transactional
    public NavigationChannelResponse create(NavigationChannelCreateRequest req, String username) {
        String channelCode = req.getChannelCode();
        if (channelCode == null || channelCode.trim().isEmpty()) {
            String orgCode = orgUnitRepository.findById(req.getOrgUnitId())
                    .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getCode)
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don vi voi id: " + req.getOrgUnitId()));
            long count = repo.countByOrgUnitId(req.getOrgUnitId());
            channelCode = orgCode + "-NC-" + String.format("%06d", count + 1);
        }

        NavigationChannel nc = NavigationChannel.builder()
                .channelName(req.getChannelName())
                .channelCode(channelCode)
                .stationAmountt(req.getStationAmountt())
                .latestStationRepairDate(req.getLatestStationRepairDate())
                .stationArea(req.getStationArea())
                .note(req.getNote())
                .seaportId(req.getSeaportId())
                .operatingUnitId(req.getOperatingUnitId())
                .location(req.getLocation())
                .detailedLocation(req.getDetailedLocation())
                .channelManagementStation(req.getChannelManagementStation())
                .stationStaffAmount(req.getStationStaffAmount())
                .latestMaintenanceYear(req.getLatestMaintenanceYear())
                .dredgingVolume(req.getDredgingVolume())
                .buoyAmount(req.getBuoyAmount())
                .beaconAmount(req.getBeaconAmount())
                .status(req.getStatus())
                .orgUnitId(req.getOrgUnitId())
                .approvalStatus(NavigationChannelApprovalStatus.PROPOSED)
                .isApprovedLevel1(false)
                .isApprovedLevel2(false)
                .isDeleted(false)
                .createdBy(username)
                .build();

        nc = repo.save(nc);

        if (req.getToaDo() != null && !req.getToaDo().trim().isEmpty()) {
            GisGeometryType geomType = req.getLoaiHinhHoc() != null ? req.getLoaiHinhHoc() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = nc.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    req.getChannelName(),
                    "NC_" + nc.getId(),
                    geomType,
                    objType,
                    req.getToaDo(),
                    refId,
                    KchtType.NAVIGATION_CHANNEL
            );
            nc.setSpatialId(spatialObj.getId());
            nc = repo.save(nc);
        }

        return toResponse(nc);
    }

    @Transactional(readOnly = true)
    public NavigationChannelResponse getById(UUID id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id)));
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findAll() {
        return repo.findByIsDeletedFalse(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NavigationChannelResponse> findAll(int page, int size) {
        return repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NavigationChannelResponse> search(UUID orgUnitId, String keyword,
                                                   String approvalStatusStr, int page, int size) {
        Page<NavigationChannel> results;
        NavigationChannelApprovalStatus approvalStatus = null;
        if (approvalStatusStr != null && !approvalStatusStr.isEmpty()) {
            try { approvalStatus = NavigationChannelApprovalStatus.valueOf(approvalStatusStr); } catch (Exception ignored) {}
        }
        if (orgUnitId != null || (keyword != null && !keyword.isEmpty()) || approvalStatus != null) {
            results = repo.searchDocuments(orgUnitId, keyword, approvalStatus,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        } else {
            results = repo.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return results.map(this::toResponse);
    }

    @Transactional
    public NavigationChannelResponse update(UUID id, NavigationChannelUpdateRequest req, String username) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (req.getChannelName() != null) nc.setChannelName(req.getChannelName());
        if (req.getStationAmountt() != null) nc.setStationAmountt(req.getStationAmountt());
        if (req.getLatestStationRepairDate() != null) nc.setLatestStationRepairDate(req.getLatestStationRepairDate());
        if (req.getStationArea() != null) nc.setStationArea(req.getStationArea());
        if (req.getNote() != null) nc.setNote(req.getNote());
        if (req.getChannelCode() != null) nc.setChannelCode(req.getChannelCode());
        if (req.getSeaportId() != null) nc.setSeaportId(req.getSeaportId());
        if (req.getOperatingUnitId() != null) nc.setOperatingUnitId(req.getOperatingUnitId());
        if (req.getLocation() != null) nc.setLocation(req.getLocation());
        if (req.getDetailedLocation() != null) nc.setDetailedLocation(req.getDetailedLocation());
        if (req.getChannelManagementStation() != null) nc.setChannelManagementStation(req.getChannelManagementStation());
        if (req.getStationStaffAmount() != null) nc.setStationStaffAmount(req.getStationStaffAmount());
        if (req.getLatestMaintenanceYear() != null) nc.setLatestMaintenanceYear(req.getLatestMaintenanceYear());
        if (req.getDredgingVolume() != null) nc.setDredgingVolume(req.getDredgingVolume());
        if (req.getBuoyAmount() != null) nc.setBuoyAmount(req.getBuoyAmount());
        if (req.getBeaconAmount() != null) nc.setBeaconAmount(req.getBeaconAmount());
        if (req.getStatus() != null) nc.setStatus(req.getStatus());
        if (req.getOrgUnitId() != null) nc.setOrgUnitId(req.getOrgUnitId());
        nc.setUpdatedBy(username);

        if (req.getToaDo() != null) {
            if (req.getToaDo().trim().isEmpty()) {
                if (nc.getSpatialId() != null) {
                    gisSpatialObjectService.delete(nc.getSpatialId());
                    nc.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = req.getLoaiHinhHoc() != null ? req.getLoaiHinhHoc() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = nc.getId();
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        nc.getSpatialId(),
                        nc.getChannelName(),
                        "NC_" + nc.getId(),
                        geomType,
                        objType,
                        req.getToaDo(),
                        refId,
                        KchtType.NAVIGATION_CHANNEL
                );
                nc.setSpatialId(spatialObj.getId());
            }
        } else if (nc.getSpatialId() != null && req.getChannelName() != null) {
            gisSpatialObjectService.findById(nc.getSpatialId()).ifPresent(spatialObj -> {
                UUID refId = nc.getId();
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        req.getChannelName(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        KchtType.NAVIGATION_CHANNEL
                );
            });
        }

        NavigationChannel saved = repo.save(nc);
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        // Only approved records can be soft-deleted
        if (nc.getApprovalStatus() != NavigationChannelApprovalStatus.APPROVED) {
            throw new IllegalStateException("Chi co luong hang hai da duyet moi co the xoa mem");
        }

        nc.setIsDeleted(true);
        if (nc.getSpatialId() != null) {
            gisSpatialObjectService.delete(nc.getSpatialId());
        }
        repo.save(nc);
        log.info("Soft deleted navigation channel id={}", id);
    }

    @Transactional
    public ApprovalResponse approveC1(UUID id, ApprovalRequest req, String approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (nc.getApprovalStatus() != NavigationChannelApprovalStatus.PROPOSED
                && nc.getApprovalStatus() != NavigationChannelApprovalStatus.REJECTED) {
            throw new IllegalStateException("Chi co the phe duyet C1 khi trang thai la PROPOSED hoac REJECTED");
        }

        nc.setIsApprovedLevel1(true);
        nc.setApproverLevel1(approvedBy);
        nc.setApprovedDateLevel1(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getStatus())) {
            nc.setApprovalStatus(NavigationChannelApprovalStatus.UNDER_REVIEW);
        } else {
            nc.setApprovalStatus(NavigationChannelApprovalStatus.REJECTED);
            nc.setRejectionReason(req.getReason());
        }

        saveApprovalHistory(nc, 1, req.getStatus(), approvedBy, req.getReason());
        return buildApprovalResponse(nc, 1);
    }

    @Transactional
    public ApprovalResponse approveC2(UUID id, ApprovalRequest req, String approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        if (nc.getApprovalStatus() != NavigationChannelApprovalStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Chi co the phe duyet C2 khi trang thai la UNDER_REVIEW");
        }

        String c1Actor = nc.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException("Nguoi phe duyet C2 khong duoc trung voi nguoi phe duyet C1");
        }

        nc.setIsApprovedLevel2(true);
        nc.setApproverLevel2(approvedBy);
        nc.setApprovedDateLevel2(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getStatus())) {
            nc.setApprovalStatus(NavigationChannelApprovalStatus.APPROVED);
        } else {
            nc.setApprovalStatus(NavigationChannelApprovalStatus.REJECTED);
            nc.setRejectionReason(req.getReason());
        }

        saveApprovalHistory(nc, 2, req.getStatus(), approvedBy, req.getReason());
        return buildApprovalResponse(nc, 2);
    }

    @Transactional
    public ApprovalResponse reject(UUID id, ApprovalRequest req, String approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        nc.setApprovalStatus(NavigationChannelApprovalStatus.REJECTED);
        nc.setRejectionReason(req.getReason());

        Integer cap = req.getApprovalLevel() != null ? req.getApprovalLevel() : 1;
        saveApprovalHistory(nc, cap, "REJECTED", approvedBy, req.getReason());
        return buildApprovalResponse(nc, cap);
    }

    private void saveApprovalHistory(NavigationChannel nc, Integer cap, String status, String user, String reason) {
        ApprovalHistory hist = ApprovalHistory.builder()
                .navigationChannel(nc)
                .approvalLevel(cap)
                .status(status)
                .approvedBy(user)
                .approvedDate(LocalDate.now())
                .reason(reason)
                .build();
        approvalHistoryRepo.save(hist);
        nc.getApprovalHistory().add(hist);
    }

    private ApprovalResponse buildApprovalResponse(NavigationChannel nc, Integer cap) {
        return ApprovalResponse.builder()
                .id(String.valueOf(nc.getId()))
                .navigationChannelId(nc.getId())
                .approvalLevel(cap)
                .status(nc.getApprovalStatus().name())
                .approvedBy(cap == 1 ? nc.getApproverLevel1() : nc.getApproverLevel2())
                .approvedDate(cap == 1 ? nc.getApprovedDateLevel1() : nc.getApprovedDateLevel2())
                .reason(nc.getRejectionReason())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getApprovalHistory(UUID id) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay luong hang hai voi id: " + id));

        List<ApprovalHistory> history = approvalHistoryRepo.findByNavigationChannelIdOrderByApprovedDateDesc(id);
        return history.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .navigationChannelId(h.getNavigationChannel().getId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus())
                .approvedBy(h.getApprovedBy())
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findByApprovalStatus(NavigationChannelApprovalStatus s) {
        return repo.findByApprovalStatusAndIsDeletedFalse(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> searchByChannelNameContaining(String kw) {
        return repo.findByChannelNameContainingAndIsDeletedFalse(kw)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KetQuaTimKiemResponse searchDocuments(UUID orgUnitId, String kw, String trangThaiStr, int page, int size) {
        NavigationChannelApprovalStatus trangThai = null;
        if (trangThaiStr != null && !trangThaiStr.trim().isEmpty()) {
            try { trangThai = NavigationChannelApprovalStatus.valueOf(trangThaiStr.trim()); } catch (Exception ignored) {}
        }
        String keywordLike = (kw != null && !kw.trim().isEmpty()) ? "%" + kw.trim().toLowerCase() + "%" : null;
        Page<NavigationChannel> r = repo.searchDocuments(orgUnitId, keywordLike, trangThai, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return KetQuaTimKiemResponse.builder()
                .results(r.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(r.getTotalElements())
                .totalPages(r.getTotalPages())
                .currentPage(r.getNumber())
                .pageSize(r.getSize())
                .build();
    }

    private NavigationChannelResponse toResponse(NavigationChannel nc) {
        List<NavigationChannelAttachmentResponse> atts = nc.getAttachments() != null
                ? nc.getAttachments().stream()
                        .map(a -> NavigationChannelAttachmentResponse.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .filePath(a.getFilePath())
                                .fileSize(a.getFileSize())
                                .uploadDate(a.getUploadDate())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        List<ApprovalResponse> hist = nc.getApprovalHistory() != null
                ? nc.getApprovalHistory().stream()
                        .map(h -> ApprovalResponse.builder()
                                .id(String.valueOf(h.getId()))
                                .navigationChannelId(h.getNavigationChannel().getId())
                                .approvalLevel(h.getApprovalLevel())
                                .status(h.getStatus())
                                .approvedBy(h.getApprovedBy())
                                .approvedDate(h.getApprovedDate())
                                .reason(h.getReason())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        GisGeometryType geomType = null;
        String coords = null;
        if (nc.getSpatialId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(nc.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        List<ChiTietTuyenLuongResponse> chiTietList = nc.getChiTietTuyenLuongList() != null
                ? nc.getChiTietTuyenLuongList().stream()
                        .map(ct -> ChiTietTuyenLuongResponse.builder()
                                .id(ct.getId())
                                .stt(ct.getStt())
                                .phanLoai(ct.getPhanLoai())
                                .ma(ct.getMa())
                                .ten(ct.getTen())
                                .loaiTuyenLuong(ct.getLoaiTuyenLuong())
                                .doSauHienTai(ct.getDoSauHienTai())
                                .maiDocThietKe(ct.getMaiDocThietKe())
                                .chieuDai(ct.getChieuDai())
                                .rongLonNhat(ct.getRongLonNhat())
                                .rongNhoNhat(ct.getRongNhoNhat())
                                .doSau(ct.getDoSau())
                                .khoiLuongNaoVet(ct.getKhoiLuongNaoVet())
                                .congCong(ct.getCongCong())
                                .chuyenDung(ct.getChuyenDung())
                                .clearanceHeight(ct.getChieuCaoTinhKhong())
                                .viTriVungQuayTau(ct.getViTriVungQuayTau())
                                .banKinhVungQuayTau(ct.getBanKinhVungQuayTau())
                                .banKinhCongNhoNhat(ct.getBanKinhCongNhoNhat())
                                .phamViBaoVeLuong(ct.getPhamViBaoVeLuong())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        String resolvedOrgUnitName = resolveOrgUnitName(nc.getOrgUnitId());

        return NavigationChannelResponse.builder()
                .id(nc.getId())
                .channelName(nc.getChannelName())
                .stationAmountt(nc.getStationAmountt())
                .latestStationRepairDate(nc.getLatestStationRepairDate())
                .stationArea(nc.getStationArea())
                .note(nc.getNote())
                .channelCode(nc.getChannelCode())
                .seaportId(nc.getSeaportId())
                .operatingUnitId(nc.getOperatingUnitId())
                .location(nc.getLocation())
                .detailedLocation(nc.getDetailedLocation())
                .channelManagementStation(nc.getChannelManagementStation())
                .stationStaffAmount(nc.getStationStaffAmount())
                .latestMaintenanceYear(nc.getLatestMaintenanceYear())
                .dredgingVolume(nc.getDredgingVolume())
                .buoyAmount(nc.getBuoyAmount())
                .beaconAmount(nc.getBeaconAmount())
                .status(nc.getStatus())
                .orgUnitId(nc.getOrgUnitId())
                .orgUnitName(resolvedOrgUnitName)
                .approvalStatus(nc.getApprovalStatus())
                .isApprovedLevel1(nc.getIsApprovedLevel1())
                .approverLevel1(nc.getApproverLevel1())
                .approvedDateLevel1(nc.getApprovedDateLevel1())
                .isApprovedLevel2(nc.getIsApprovedLevel2())
                .approverLevel2(nc.getApproverLevel2())
                .approvedDateLevel2(nc.getApprovedDateLevel2())
                .rejectionReason(nc.getRejectionReason())
                .isDeleted(nc.getIsDeleted())
                .createdAt(nc.getCreatedAt())
                .updatedAt(nc.getUpdatedAt())
                .createdBy(nc.getCreatedBy())
                .updatedBy(nc.getUpdatedBy())
                .attachments(atts)
                .approvalHistory(hist)
                .clearanceHeight(nc.getClearanceHeight())
                .chiTietTuyenLuongList(chiTietList)
                .spatialId(nc.getSpatialId())
                .loaiHinhHoc(geomType)
                .toaDo(coords)
                .build();
    }

    private String resolveOrgUnitName(java.util.UUID orgUnitId) {
        if (orgUnitId == null) return null;
        return orgUnitRepository.findById(orgUnitId)
                .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                .orElse(null);
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
