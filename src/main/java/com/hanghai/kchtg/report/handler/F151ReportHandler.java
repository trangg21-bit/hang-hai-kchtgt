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
                if (child.getChannelLengthKilometers() != null) {
                    sumLength = sumLength.add(child.getChannelLengthKilometers());
                }
                if (child.getRouteLatestDredgingVolumeCubicMeters() != null) {
                    sumDredgingVolume = sumDredgingVolume.add(child.getRouteLatestDredgingVolumeCubicMeters());
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
            parentRow.put("Tên trạm QL luồng", nc.getManagementStation() != null ? nc.getManagementStation() : "");
            parentRow.put("Số lượng trạm", nc.getStationCount() != null ? nc.getStationCount() : "");
            parentRow.put("Diện tích (m2)", nc.getStationAreaSquareMeters() != null ? nc.getStationAreaSquareMeters() : "");
            parentRow.put("Thời điểm SC", nc.getLatestStationRepairMonth() != null
                    ? nc.getLatestStationRepairMonth().toString() : "");
            parentRow.put("Nhân sự", nc.getStationStaffCount() != null ? nc.getStationStaffCount() : "");
            parentRow.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffCount() != null ? nc.getStationStaffCount() : "");
            parentRow.put("Chiều cao tĩnh không", children.isEmpty() ? ""
                    : String.valueOf(children.get(0).getVerticalClearanceMeters()));
            parentRow.put("ĐVQL vận hành", donVi);
            rows.add(parentRow);

            // Child rows
            for (ChannelRouteDetail child : children) {
                Map<String, Object> childRow = new LinkedHashMap<>();
                childRow.put("STT", "");
                childRow.put("Chỉ tiêu", child.getRouteName() != null ? child.getRouteName() : "");
                childRow.put("Dài (km)", child.getChannelLengthKilometers() != null ? child.getChannelLengthKilometers() : "");
                childRow.put("Rộng LN (m)", child.getMaximumDesignWidthMeters() != null ? child.getMaximumDesignWidthMeters() : "");
                childRow.put("Rộng NN (m)", child.getMinimumDesignWidthMeters() != null ? child.getMinimumDesignWidthMeters() : "");
                childRow.put("Độ sâu (m)", child.getDesignDepthMeters() != null ? child.getDesignDepthMeters() : "");
                childRow.put("Mái dốc", child.getDesignSlope() != null ? child.getDesignSlope() : "");
                childRow.put("Độ sâu hiện tại", child.getCurrentDepthMeters() != null ? child.getCurrentDepthMeters() : "");
                childRow.put("KL nạo vét (m3)", child.getRouteLatestDredgingVolumeCubicMeters() != null ? child.getRouteLatestDredgingVolumeCubicMeters() : "");
                childRow.put("Tên trạm QL luồng", "");
                childRow.put("Số lượng trạm", "");
                childRow.put("Diện tích (m2)", "");
                childRow.put("Thời điểm SC", "");
                childRow.put("Nhân sự", "");
                childRow.put("Chiều cao tĩnh không", child.getVerticalClearanceMeters() != null
                        ? String.valueOf(child.getVerticalClearanceMeters()) : "");
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
                if (child.getChannelLengthKilometers() != null) {
                    sumLength = sumLength.add(child.getChannelLengthKilometers());
                }
                if (child.getRouteLatestDredgingVolumeCubicMeters() != null) {
                    sumDredgingVolume = sumDredgingVolume.add(child.getRouteLatestDredgingVolumeCubicMeters());
                }
            }

            String donVi = resolveOrgUnitName(nc.getOrgUnitId());

            // Parent row
            Map<String, Object> parentItem = new HashMap<>();
            parentItem.put("sequenceNo", sequenceNo);
            parentItem.put("ten", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentItem.put("tenTramQuanLyLuong", nc.getManagementStation() != null ? nc.getManagementStation() : "");
            parentItem.put("soLuongTram", nc.getStationCount() != null ? nc.getStationCount().doubleValue() : 0.0);
            parentItem.put("dienTich", nc.getStationAreaSquareMeters() != null ? nc.getStationAreaSquareMeters().doubleValue() : 0.0);
            parentItem.put("thoiDiemSuaChuaGanNhat", nc.getLatestStationRepairMonth() != null
                    ? nc.getLatestStationRepairMonth().toString() : "");
            parentItem.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffCount() != null
                    ? nc.getStationStaffCount().doubleValue() : 0.0);

            parentItem.put("donViQuanLyVanHanh", donVi);
            parentItem.put("chieuCaoTinhKhong", children.isEmpty() || children.get(0).getVerticalClearanceMeters() == null
                    ? "" : String.valueOf(children.get(0).getVerticalClearanceMeters()));
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
                childItem.put("ten", child.getRouteName() != null ? child.getRouteName() : "");
                childItem.put("tenTramQuanLyLuong", "");
                childItem.put("soLuongTram", 0.0);
                childItem.put("dienTichTram", 0.0);
                childItem.put("thoiDiemSuaChuaGanNhat", "");
                childItem.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffCount() != null ? nc.getStationStaffCount().doubleValue() : 0.0);
                childItem.put("chieuCaoTinhKhong", child.getVerticalClearanceMeters() != null
                        ? String.valueOf(child.getVerticalClearanceMeters()) : "");
                childItem.put("donViQuanLyVanHanh", "");
                childItem.put("daiLuong", child.getChannelLengthKilometers() != null ? child.getChannelLengthKilometers().doubleValue() : 0.0);
                childItem.put("maTuyenLuong", child.getRouteCode() != null ? child.getRouteCode() : "");
                childItem.put("rongLonNhat", child.getMaximumDesignWidthMeters() != null ? child.getMaximumDesignWidthMeters().doubleValue() : 0.0);
                childItem.put("rongNhoNhat", child.getMinimumDesignWidthMeters() != null ? child.getMinimumDesignWidthMeters().doubleValue() : 0.0);
                childItem.put("doSau", child.getDesignDepthMeters() != null ? child.getDesignDepthMeters().doubleValue() : 0.0);
                childItem.put("maiDoc", child.getDesignSlope() != null ? child.getDesignSlope() : "");
                childItem.put("doSauHienTai", child.getCurrentDepthMeters() != null ? child.getCurrentDepthMeters() : "");
                childItem.put("khoiLuongNaoVetDuyTu", child.getRouteLatestDredgingVolumeCubicMeters() != null
                        ? child.getRouteLatestDredgingVolumeCubicMeters().doubleValue() : 0.0);
                // Parent context for template back-reference
                childItem.put("tenTram", nc.getManagementStation() != null ? nc.getManagementStation() : "");
                childItem.put("soLuongTramParent", nc.getStationCount() != null ? nc.getStationCount().doubleValue() : 0.0);
                childItem.put("dienTichParent", nc.getStationAreaSquareMeters() != null ? nc.getStationAreaSquareMeters().doubleValue() : 0.0);
                childItem.put("thoiDiemSuaChuaParent", nc.getLatestStationRepairMonth() != null ? nc.getLatestStationRepairMonth().toString() : "");
                childItem.put("donViQLVH", donVi);
                // Generic backward-compatible keys
                childItem.put("name", child.getRouteName() != null ? child.getRouteName() : "");
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
