package com.hanghai.kchtg.report.entity;

import lombok.Getter;

/**
 * Standard report form types for the maritime KCHTGT reporting module.
 * Cloned from hh.csdl EnumBcNhom to match all available report forms.
 */
@Getter
public enum ReportType {
    // Keep existing 7 in order so Ordinal mapping stays identical
    B03_CCTT(1, "Mẫu B03/CCTT"),
    FORM_02(2, "Mẫu 02"),
    FORM_03(3, "Mẫu 03"),
    FORM_04(4, "Mẫu 04"),
    FORM_05(5, "Mẫu 05"),
    FORM_06(6, "Mẫu 06"),
    SUMMARY(7, "Mẫu 07"),

    // BCKCHT: Nhóm chỉ tiêu kết cấu hạ tầng
    BCKCHT_163(163, "Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng"),
    BCKCHT_164(164, "Biểu 02-N: Năng lực thông qua cảng biển"),
    BCKCHT_165(165, "Biểu 03-N: Thống kê cầu cảng"),
    BCKCHT_166(166, "Biểu 04-N: Thống kê luồng hàng hải"),
    BCKCHT_167(167, "Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão"),
    BCKCHT_168(168, "Biểu 05-N: Thống kê khu chuyển tải, khu neo đậu"),
    BCKCHT_169(169, "Biểu 07-N: Thống kê bến phao, khu neo đậu"),
    BCKCHT_170(170, "Biểu 08-N: Thống kê hệ thống đèn biển"),
    BCKCHT_171(171, "Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng"),
    BCKCHT_172(172, "Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng"),
    BCKCHT_173(173, "Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS)"),
    BCKCHT_174(174, "Biểu 12-N: Hệ thống các đài thông tin duyên hải"),
    BCKCHT_175(175, "Biểu 13-N: Thống kê về hệ thống đê, kè chắn sóng, chắn cát"),

    // BCDL: Nhóm chỉ tiêu đo lường
    BCDL_176(176, "Biểu 14-T: Báo cáo chi tiết tàu biển ra, vào cảng biển"),
    BCDL_177(177, "Biểu 15-T: Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển"),
    BCDL_178(178, "Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời tại khu vực cảng biển"),
    BCDL_179(179, "Biểu 17-Q: Thống kê tàu biển Việt Nam vận tải quốc tế tại khu vực cảng biển"),
    BCDL_180(180, "Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng"),
    BCDL_181(181, "Biểu 12-N: Khối lượng hàng hóa, hành khách thông qua cảng biển theo năm"),
    BCDL_182(182, "Biểu 13-T: Lượt tàu thuyền ra, vào cảng"),
    BCDL_183(183, "Biểu 14-T: Khối lượng hàng hóa thông qua cảng biển bằng đội tàu biển Việt Nam và phương tiện thủy nội địa"),
    BCDL_184(184, "Biểu 15-T: Khối lượng hàng hóa, lượt tàu thông qua cảng biển, bến trong khu vực quản lý"),

    // BCPTTV: Nhóm chỉ tiêu phương tiện và thuyền viên
    BCPTTV_185(185, "Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải"),
    BCPTTV_186(186, "Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam"),
    BCPTTV_187(187, "Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt"),

    // BCDN: Nhóm chỉ tiêu về doanh nghiệp
    BCDN_188(188, "Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển"),
    BCDN_189(189, "Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển"),

    // BCTT48: Nhóm báo cáo thông tư 48/2017/TT-BGTVT
    BCTT48_190(190, "Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng thông tư 48/2017/TT-BGTVT"),
    BCTT48_191(191, "Biểu 07-N: Năng lực thông qua cảng biển, cảng bến thủy nội địa địa phương và doanh nghiệp quản lý"),
    BCTT48_192(192, "Biểu 28-T: Khối lượng hàng hóa thông qua cảng"),
    BCTT48_193(193, "Biểu 29-N: Khối lượng hàng hóa thông qua cảng"),
    BCTT48_194(194, "Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ vận tải đường sắt, đường thủy nội địa, đường biển"),

    // BCCNDB: Nhóm chỉ tiêu chuyên ngành bảo đảm
    BCCNDB_195(195, "Biểu Tổng hợp thông tin chung"),
    BCCNDB_196(196, "Biểu Tổng hợp thông tin kết cấu hạ tầng giao thông hàng hải"),
    BCCNDB_197(197, "Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải"),
    BCCNDB_198(198, "Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Cầu cảng"),
    BCCNDB_199(199, "Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Luồng hàng hải"),
    BCCNDB_200(200, "Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Phao tiêu báo hiệu và nhà trạm quản lý vận hành"),
    BCCNDB_201(201, "Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đèn biển và nhà trạm gắn với đèn biển"),
    BCCNDB_202(202, "Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đê, kè"),
    BCCNDB_203(203, "Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải"),
    BCCNDB_204(204, "Báo cáo tình hình hoạt động của báo hiệu hàng hải và công trình đê, kè"),

    // BCTHTN: Báo cáo tổng hợp theo ngày
    BCDL_180N(1800, "Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày"),
    BCDL_182N(1820, "Biểu 13-T: Lượt tàu thuyền vào, rời cảng biển theo ngày"),
    BCDL_183N(1830, "Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu thông qua cảng biển bằng đội tàu Việt Nam theo ngày"),
    BCDL_184N(1840, "Biểu 15-T: Khối lượng hàng hóa, hành khách thông qua qua cảng biển, bến cảng, khu chuyển tải trong khu vực quản lý theo ngày");

    private final int value;
    private final String description;

    ReportType(int value, String description) {
        this.value = value;
        this.description = description;
    }
}
