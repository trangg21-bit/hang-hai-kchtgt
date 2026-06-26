package com.hanghai.kchtg.datasharing.entity;

/**
 * Enumerates all 18 KCHTGT asset types available for data sharing and export.
 * Each type corresponds to a specific maritime infrastructure or system category.
 */
public enum ShareDataType {

    PORT("Bến cảng"),
    DOCK("Cầu cảng"),
    BUOY_BERTH("Bến phao"),
    TRANSFER_AREA("Khu tranh đấu"),
    TRANSIT_AREA("Khu chuyên tải"),
    ANCHORAGE("Khu neo đậu"),
    REPAIR_FACILITY("Cơ sở sửa chữa"),
    LIGHTHOUSE("Đèn biển"),
    BUOY_SIGN("Phao tiêu"),
    VTS_SYSTEM("Hệ thống VTS"),
    VTS_CONTROL_CENTER("Trung tâm điều hành VTS"),
    RADAR_STATION("Trạm Radar"),
    AIS_SYSTEM("Hệ thống AIS"),
    CCTV_SYSTEM("Hệ thống CCTV"),
    SCADA_SYSTEM("Hệ thống SCADA"),
    VHF_INFO_SYSTEM("Hệ thống thông tin VHF"),
    TELECOMM_SYSTEM("Hệ thống truyền dẫn"),
    VTS_ASSIST_SYSTEM("Hệ thống phụ trợ VTS");

    private final String label;

    ShareDataType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
