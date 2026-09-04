package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApprovalStatus {
    DRAFT(0, "Lưu tạm"),
    PROPOSED(1, "Đang đề xuất"),
    PENDING_APPROVAL(2, "Chờ phê duyệt cấp Cảng vụ/Chi cục"),
    APPROVED_LEVEL1(3, "Chờ phê duyệt cấp Cục"),
    APPROVED_LEVEL2(4, "Đã duyệt cấp 2 (Legacy)"),
    APPROVED(5, "Đã phê duyệt"),
    REJECTED(6, "Từ chối (Legacy)"),
    ARCHIVED(7, "Đã xóa (Lịch sử)"),
    REJECTED_LEVEL1(8, "Từ chối cấp Cảng vụ/Chi cục"),
    REJECTED_LEVEL2(9, "Từ chối cấp Cục");

    private final int value;
    private final String label;

    ApprovalStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public int getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static ApprovalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (ApprovalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            String upper = name.toUpperCase().trim();
            switch (upper) {
                case "DRAFT":
                case "LƯU TẠM":
                case "LUU TAM":
                    return DRAFT;
                case "PROPOSED":
                case "ĐANG ĐỀ XUẤT":
                case "DANG DE XUAT":
                    return PROPOSED;
                case "PENDING":
                case "PENDING_APPROVAL":
                case "PORT_AUTHORITY":
                case "CHỜ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC":
                case "CHO PHE DUYET CAP CANG VU/CHI CUC":
                case "CHỜ CẢNG VỤ DUYỆT":
                case "CHO CANG VU DUYET":
                case "CHỜ CẢNG VỤ / CHI CỤC DUYỆT":
                case "CHO CANG VU / CHI CUC DUYET":
                    return PENDING_APPROVAL;
                case "APPROVED_L1":
                case "APPROVED_LEVEL1":
                case "CHỜ PHÊ DUYỆT CẤP CỤC":
                case "CHO PHE DUYET CAP CUC":
                case "CHỜ CỤC DUYỆT":
                case "CHO CUC DUYET":
                    return APPROVED_LEVEL1;
                case "APPROVED_L2":
                case "APPROVED_LEVEL2":
                    return APPROVED_LEVEL2;
                case "APPROVED":
                case "PUBLISHED":
                case "ĐÃ PHÊ DUYỆT":
                case "DA PHE DUYET":
                case "ĐÃ DUYỆT":
                case "DA DUYET":
                    return APPROVED;
                case "REJECTED":
                case "TỪ CHỐI":
                case "TU CHOI":
                    return REJECTED;
                case "ARCHIVED":
                case "ĐÃ XÓA":
                case "DA XOA":
                case "LƯU TRỮ":
                case "LUU TRU":
                    return ARCHIVED;
                case "REJECTED_L1":
                case "REJECTED_LEVEL1":
                case "TỪ CHỐI CẤP CẢNG VỤ/CHI CỤC":
                case "TU CHOI CAP CANG VU/CHI CUC":
                case "BỊ CẢNG VỤ / CHI CỤC TRẢ VỀ":
                case "BI CANG VU / CHI CUC TRA VE":
                case "CẢNG VỤ TRẢ VỀ":
                case "CANG VU TRA VE":
                    return REJECTED_LEVEL1;
                case "REJECTED_L2":
                case "REJECTED_LEVEL2":
                case "TỪ CHỐI CẤP CỤC":
                case "TU CHOI CAP CUC":
                case "BỊ CỤC TRẢ VỀ":
                case "BI CUC TRA VE":
                case "CỤC TRẢ VỀ":
                case "CUC TRA VE":
                    return REJECTED_LEVEL2;
            }
            return ApprovalStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái phê duyệt không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
