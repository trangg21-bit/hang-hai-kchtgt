package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.navigationchannel.repository.ChannelRouteDetailRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
public class F151ReportHandler extends BaseReportHandler {

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Autowired
    private ChannelRouteDetailRepository channelRouteDetailRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-151".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<NavigationChannel> ncList = navigationChannelRepository
                .findByDeletedAtIsNull(Sort.unsorted())
                .stream()
                .filter(nc -> skipFilter || targetUnitId.equals(nc.getOrgUnitId()))
                .filter(nc -> (nc.getUpdatedAt() == null && nc.getCreatedAt() == null)
                        || (nc.getUpdatedAt() != null && nc.getUpdatedAt().getYear() <= reportYear)
                        || (nc.getCreatedAt() != null && nc.getCreatedAt().getYear() <= reportYear))
                .filter(nc -> nc.getApprovalStatus() == null
                        || nc.getApprovalStatus() == ApprovalStatus.APPROVED)
                .toList();

        List<String> headers = List.of(
            "STT", "Chỉ tiêu", "Dài (km)", "Rộng LN (m)", "Rộng NN (m)",
            "Độ sâu (m)", "Mái dốc", "Độ sâu hiện tại", "KL nạo vét (m3)",
            "Công cộng", "Chuyên dùng", "Tên trạm QL luồng", "Số lượng trạm",
            "Diện tích (m2)", "Thời điểm SC", "Nhân sự", "Chiều cao tĩnh không",
            "ĐVQL vận hành"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int sequenceNo = 0;
        for (NavigationChannel nc : ncList) {
            sequenceNo++;

            // Load children
            List<ChannelRouteDetail> children = channelRouteDetailRepository
                    .findByNavigationChannelIdOrderBySequenceNoAsc(nc.getId());

            // Sum child lengths
            BigDecimal sumLength = BigDecimal.ZERO;
            BigDecimal sumDredgingVolume = BigDecimal.ZERO;
            for (ChannelRouteDetail child : children) {
                if (child.getLength() != null) {
                    sumLength = sumLength.add(child.getLength());
                }
                if (child.getDredgingVolume() != null) {
                    sumDredgingVolume = sumDredgingVolume.add(child.getDredgingVolume());
                }
            }

            String donVi = resolveOrgUnitName(nc.getOrgUnitId());

            // Parent row
            Map<String, Object> parentRow = new LinkedHashMap<>();
            parentRow.put("STT", sequenceNo);
            parentRow.put("Chỉ tiêu", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentRow.put("Dài (km)", sumLength);
            parentRow.put("Rộng LN (m)", "");
            parentRow.put("Rộng NN (m)", "");
            parentRow.put("Độ sâu (m)", "");
            parentRow.put("Mái dốc", "");
            parentRow.put("Độ sâu hiện tại", "");
            parentRow.put("KL nạo vét (m3)", sumDredgingVolume);
            parentRow.put("Công cộng", "");
            parentRow.put("Chuyên dùng", "");
            parentRow.put("Tên trạm QL luồng", nc.getChannelManagementStation() != null ? nc.getChannelManagementStation() : "");
            parentRow.put("Số lượng trạm", nc.getStationAmountt() != null ? nc.getStationAmountt() : "");
            parentRow.put("Diện tích (m2)", nc.getStationArea() != null ? nc.getStationArea() : "");
            parentRow.put("Thời điểm SC", nc.getLatestStationRepairDate() != null
                    ? nc.getLatestStationRepairDate().toString() : "");
            parentRow.put("Nhân sự", nc.getStationStaffAmount() != null ? nc.getStationStaffAmount() : "");
            parentRow.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffAmount() != null ? nc.getStationStaffAmount() : "");
            parentRow.put("Chiều cao tĩnh không", nc.getClearanceHeight() != null ? nc.getClearanceHeight() : "");
            parentRow.put("ĐVQL vận hành", donVi);
            rows.add(parentRow);

            // Child rows
            for (ChannelRouteDetail child : children) {
                Map<String, Object> childRow = new LinkedHashMap<>();
                childRow.put("STT", "");
                childRow.put("Chỉ tiêu", child.getName() != null ? child.getName() : "");
                childRow.put("Dài (km)", child.getLength() != null ? child.getLength() : "");
                childRow.put("Rộng LN (m)", child.getMaxWidth() != null ? child.getMaxWidth() : "");
                childRow.put("Rộng NN (m)", child.getMinWidth() != null ? child.getMinWidth() : "");
                childRow.put("Độ sâu (m)", child.getDepth() != null ? child.getDepth() : "");
                childRow.put("Mái dốc", child.getDesignSlope() != null ? child.getDesignSlope() : "");
                childRow.put("Độ sâu hiện tại", child.getCurrentDepth() != null ? child.getCurrentDepth() : "");
                childRow.put("KL nạo vét (m3)", child.getDredgingVolume() != null ? child.getDredgingVolume() : "");
                childRow.put("Công cộng", Boolean.TRUE.equals(child.getPublicAccess()) ? "X" : "");
                childRow.put("Chuyên dùng", Boolean.TRUE.equals(child.getDedicated()) ? "X" : "");
                childRow.put("Tên trạm QL luồng", "");
                childRow.put("Số lượng trạm", "");
                childRow.put("Diện tích (m2)", "");
                childRow.put("Thời điểm SC", "");
                childRow.put("Nhân sự", "");
                childRow.put("Chiều cao tĩnh không", "");
                childRow.put("ĐVQL vận hành", "");
                rows.add(childRow);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số luồng", ncList.size());
        summary.put("total", ncList.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<NavigationChannel> ncList = navigationChannelRepository
                .findByDeletedAtIsNull(Sort.unsorted())
                .stream()
                .filter(nc -> skipFilter || targetUnitId.equals(nc.getOrgUnitId()))
                .filter(nc -> (nc.getUpdatedAt() == null && nc.getCreatedAt() == null)
                        || (nc.getUpdatedAt() != null && nc.getUpdatedAt().getYear() <= reportYear)
                        || (nc.getCreatedAt() != null && nc.getCreatedAt().getYear() <= reportYear))
                .filter(nc -> nc.getApprovalStatus() == null
                        || nc.getApprovalStatus() == ApprovalStatus.APPROVED)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        int sequenceNo = 0;
        for (NavigationChannel nc : ncList) {
            sequenceNo++;

            List<ChannelRouteDetail> children = channelRouteDetailRepository
                    .findByNavigationChannelIdOrderBySequenceNoAsc(nc.getId());

            BigDecimal sumLength = BigDecimal.ZERO;
            BigDecimal sumDredgingVolume = BigDecimal.ZERO;
            for (ChannelRouteDetail child : children) {
                if (child.getLength() != null) {
                    sumLength = sumLength.add(child.getLength());
                }
                if (child.getDredgingVolume() != null) {
                    sumDredgingVolume = sumDredgingVolume.add(child.getDredgingVolume());
                }
            }

            String donVi = resolveOrgUnitName(nc.getOrgUnitId());

            // Parent row
            Map<String, Object> parentItem = new HashMap<>();
            parentItem.put("sequenceNo", sequenceNo);
            parentItem.put("ten", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentItem.put("tenTramQuanLyLuong", nc.getChannelManagementStation() != null ? nc.getChannelManagementStation() : "");
            parentItem.put("soLuongTram", nc.getStationAmountt() != null ? nc.getStationAmountt().doubleValue() : 0.0);
            parentItem.put("dienTich", nc.getStationArea() != null ? nc.getStationArea().doubleValue() : 0.0);
            parentItem.put("thoiDiemSuaChuaGanNhat", nc.getLatestStationRepairDate() != null
                    ? nc.getLatestStationRepairDate().toString() : "");
            parentItem.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffAmount() != null
                    ? nc.getStationStaffAmount().doubleValue() : 0.0);

            parentItem.put("donViQuanLyVanHanh", donVi);
            parentItem.put("chieuCaoTinhKhong", nc.getClearanceHeight() != null ? nc.getClearanceHeight() : "");
            parentItem.put("daiLuong", sumLength);
            // Child fields empty for parent row
            parentItem.put("maTuyenLuong", "");
            parentItem.put("rongLonNhat", 0.0);
            parentItem.put("rongNhoNhat", 0.0);
            parentItem.put("doSau", 0.0);
            parentItem.put("maiDoc", "");
            parentItem.put("doSauHienTai", "");
            parentItem.put("khoiLuongNaoVetDuyTu", 0.0);
            parentItem.put("congCong", "");
            parentItem.put("chuyenDung", "");
            // Generic backward-compatible keys
            parentItem.put("name", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentItem.put("unitId", nc.getOrgUnitId() != null ? nc.getOrgUnitId().toString() : "");
            arrResult.add(parentItem);

            // Child rows
            for (ChannelRouteDetail child : children) {
                Map<String, Object> childItem = new HashMap<>();
                childItem.put("sequenceNo", "");
                childItem.put("ten", child.getName() != null ? child.getName() : "");
                childItem.put("tenTramQuanLyLuong", "");
                childItem.put("soLuongTram", 0.0);
                childItem.put("dienTichTram", 0.0);
                childItem.put("thoiDiemSuaChuaGanNhat", "");
                childItem.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffAmount() != null ? nc.getStationStaffAmount().doubleValue() : 0.0);
                childItem.put("chieuCaoTinhKhong", nc.getClearanceHeight() != null ? nc.getClearanceHeight() : "");
                childItem.put("donViQuanLyVanHanh", "");
                childItem.put("daiLuong", child.getLength() != null ? child.getLength().doubleValue() : 0.0);
                childItem.put("maTuyenLuong", child.getCode() != null ? child.getCode() : "");
                childItem.put("rongLonNhat", child.getMaxWidth() != null ? child.getMaxWidth().doubleValue() : 0.0);
                childItem.put("rongNhoNhat", child.getMinWidth() != null ? child.getMinWidth().doubleValue() : 0.0);
                childItem.put("doSau", child.getDepth() != null ? child.getDepth().doubleValue() : 0.0);
                childItem.put("maiDoc", child.getDesignSlope() != null ? child.getDesignSlope() : "");
                childItem.put("doSauHienTai", child.getCurrentDepth() != null ? child.getCurrentDepth() : "");
                childItem.put("khoiLuongNaoVetDuyTu", child.getDredgingVolume() != null
                        ? child.getDredgingVolume().doubleValue() : 0.0);
                childItem.put("congCong", Boolean.TRUE.equals(child.getPublicAccess()) ? "X" : "");
                childItem.put("chuyenDung", Boolean.TRUE.equals(child.getDedicated()) ? "X" : "");
                // Parent context for template back-reference
                childItem.put("tenTram", nc.getChannelManagementStation() != null ? nc.getChannelManagementStation() : "");
                childItem.put("soLuongTramParent", nc.getStationAmountt() != null ? nc.getStationAmountt().doubleValue() : 0.0);
                childItem.put("dienTichParent", nc.getStationArea() != null ? nc.getStationArea().doubleValue() : 0.0);
                childItem.put("thoiDiemSuaChuaParent", nc.getLatestStationRepairDate() != null ? nc.getLatestStationRepairDate().toString() : "");
                childItem.put("donViQLVH", donVi);
                // Generic backward-compatible keys
                childItem.put("name", child.getName() != null ? child.getName() : "");
                childItem.put("unitId", "");
                arrResult.add(childItem);
            }
        }
        return arrResult;
    }

    private String resolveOrgUnitName(UUID orgUnitId) {
        if (orgUnitId == null) return "";
        return orgUnitRepository.findById(orgUnitId)
                .map(OrgUnit::getName)
                .orElse("");
    }
}
