package com.hanghai.kchtg.report.entity;

public enum ReportType {
    F141_TANG_GIAM_TAI_SAN("F-141", "Báo cáo tăng giảm tài sản"),
    F180_TONG_HOP_THONG_TIN_CHUNG("F-180", "Biểu tổng hợp thông tin chung"),
    F151_THONG_KE_LUONG_HANG_HAI("F-151", "Biểu 03-Q/N: Thống kê luồng hàng hải");

    private final String code;
    private final String name;

    ReportType(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public static ReportType fromCode(String code) {
        for (ReportType type : values()) {
            if (type.getCode().equalsIgnoreCase(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Mã báo cáo không hợp lệ: " + code);
    }
}
