package com.hanghai.kchtg.gis.spatial.entity;

import lombok.Getter;

@Getter
public enum GisSpatialStatus {
    DRAFT(0, "Bản nháp"),
    PENDING_APPROVAL(1, "Chờ duyệt"),
    APPROVED_L1(2, "Đã duyệt L1"),
    APPROVED_L2(3, "Đã duyệt L2"),
    PUBLISHED(4, "Đã ban hành"),
    REJECTED(5, "Từ chối"),
    DELETED(6, "Đã xóa");

    private final int value;
    private final String label;

    GisSpatialStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }
}
