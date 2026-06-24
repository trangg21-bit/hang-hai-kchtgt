package com.hanghai.kchtg.report.entity;

public enum ReportType {
    F141_TANG_GIAM_TAI_SAN("F-141", "Báo cáo tăng giảm tài sản"),
    F180_TONG_HOP_THONG_TIN_CHUNG("F-180", "Biểu tổng hợp thông tin chung"),
    F151_THONG_KE_LUONG_HANG_HAI("F-151", "Biểu 03-Q/N: Thống kê luồng hàng hải"),
    F142_CCTT_TAI_CHINH_TS("F-142", "Thông tin tài chính tài sản KCHT"),
    F143_KE_KHAI_TS("F-143", "Báo cáo kê khai tài sản KCHT"),
    F144_QUAN_LY_TS("F-144", "Báo cáo tình hình quản lý tài sản KCHT"),
    F145_XU_LY_TS("F-145", "Báo cáo tình hình xử lý tài sản KCHT"),
    F146_KHAI_THAC_TS("F-146", "Báo cáo tình hình khai thác tài sản KCHT"),
    F147_DANH_MUC_TS_DE_NGHI_XU_LY("F-147", "Tổng hợp danh mục TS KCHTGT đề nghị xử lý"),
    F181_TONG_HOP_TS_HANG_HAI("F-181", "Biểu tổng hợp thông tin KCHTGT hàng hải"),
    
    // Wave 2
    F148_CANG_CAU_NANG_LUC("F-148", "Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng"),
    F149_CANG_BIEN_NANG_LUC("F-149", "Biểu 01B-N: Năng lực thông qua cảng biển"),
    F150_THONG_KE_CAU_CANG("F-150", "Biểu 02-N: Thống kê cầu cảng"),
    F152_VUNG_HOA_TIEU("F-152", "Biểu 04-6T/N: Thống kê vùng đón/trả hoa tiêu, vùng quay trở"),
    F153_KHU_CHUYEN_TAI("F-153", "Biểu 04B-N: Thống kê khu chuyển tải, khu neo đậu"),
    F154_BEN_PHAO_NEO_DAU("F-154", "Biểu 05-N: Thống kê bến phao, khu neo đậu"),
    F155_HE_THONG_DEN_BIEN("F-155", "Biểu 06-N: Thống kê hệ thống đèn biển"),
    F156_HE_THONG_PHAO_TIEU("F-156", "Biểu 07-6T/N: Thống kê hệ thống phao tiêu"),
    F157_PHAO_TIEU_BAO_HIEU("F-157", "Biểu 07B-6T/N: Thống kê phao tiêu báo hiệu"),
    F158_HE_THONG_VTS("F-158", "Biểu 08-N: Thống kê hệ thống giám sát VTS"),
    F159_THONG_TIN_DUYEN_HAI("F-159", "Biểu 09-N: Hệ thống đài thông tin duyên hải"),
    F160_DE_KE_CHAN_SONG("F-160", "Biểu 10-N: Thống kê hệ thống đê, kè chắn sóng"),

    // Wave 3
    F161_TAU_BIEN_RA_VAO("F-161", "Biểu 11-T: Báo cáo chi tiết tàu biển ra vào cảng"),
    F162_PHUONG_TIEN_THUY_NOI_DIA("F-162", "Biểu 11B-T: Báo cáo chi tiết phương tiện thủy nội địa"),
    F163_TAU_BIEN_NUOC_NGOAI("F-163", "Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời"),
    F164_TAU_BIEN_VN_QUOC_TE("F-164", "Biểu 17-Q: Thống kê tàu biển VN vận tải quốc tế"),
    F167_LUOT_TAU_VAO_ROI("F-167", "Biểu 13-T: Lượt tàu thuyền vào rời cảng biển"),
    F171_TAU_BIEN_QUOC_TICH_VN("F-171", "Biểu 22-6T/N: Thống kê tàu biển quốc tịch VN"),
    F172_TAU_THUYEN_LAI_DAT("F-172", "Biểu 23-N: Thống kê tàu thuyền hoạt động lai dắt"),
    F173_CO_SO_DONG_MOI_TAU("F-173", "Biểu 31-N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu"),

    // Wave 4
    F165_KHOI_LUONG_HANG_HOA_THANG("F-165", "Biểu 12-T: Khối lượng hàng hóa, hành khách theo tháng"),
    F166_KHOI_LUONG_HANG_HOA_NAM("F-166", "Biểu 12-N: Khối lượng hàng hóa theo năm"),
    F168_HANG_KHACH_LUOT_TAU("F-168", "Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu"),
    F169_HANG_HOA_KHU_QUAN_LY("F-169", "Biểu 15-T: Khối lượng hàng hóa trong khu quản lý"),
    F174_TONG_HOP_HANG_HOA("F-174", "Biểu 45-6T/N: Báo cáo tổng hợp hàng hóa thông qua cảng"),
    F177_KHOI_LUONG_THANG("F-177", "Biểu 28-T: Khối lượng hàng hóa theo tháng"),
    F178_KHOI_LUONG_NAM("F-178", "Biểu 29-N: Khối lượng hàng hóa theo năm"),

    // Wave 5
    F170_THUYEN_VIEN_HIEU("F-170", "Biểu 21-6T/N: Thống kê thuyền viên, hiệu"),
    F175_NANG_LUC_BEN_CANG_T48("F-175", "Biểu số 06-N: Năng lực thông qua bến cảng (Thông tư 48)"),
    F176_NANG_LUC_CANG_BIEN_THUY("F-176", "Biểu 07-N: Năng lực thông qua cảng biển, thủy nội địa"),
    F179_DOANH_NGHIEP_VAN_TAI("F-179", "Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp"),

    // Wave 6
    F182_BAO_TRI_KCHTGT("F-182", "Biểu tổng hợp thông tin bảo trì KCHTGT"),
    F183_BAO_TRI_CAU_CANG("F-183", "Biểu tổng hợp bảo trì KCHTGT - Cầu cảng"),
    F184_BAO_TRI_LUONG("F-184", "Biểu tổng hợp bảo trì KCHTGT - Luồng hàng hải"),
    F185_BAO_TRI_PHAO_TIEU("F-185", "Biểu tổng hợp bảo trì KCHTGT - Phao tiêu"),
    F186_BAO_TRI_DEN_BIEN("F-186", "Biểu tổng hợp bảo trì KCHTGT - Đèn biển"),
    F187_BAO_TRI_DE_KE("F-187", "Biểu tổng hợp bảo trì KCHTGT - Đê, kè"),
    F188_KE_KHAI_QUAN_LY_TS("F-188", "Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải"),
    F189_HOAT_DONG_BAO_HIEU_DE_KE("F-189", "Báo cáo tình hình hoạt động báo hiệu hàng hải và đê, kè");

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