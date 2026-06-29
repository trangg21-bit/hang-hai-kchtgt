package com.hanghai.kchtg.luonghanghai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private String thoiGian;
    private String nguoiThucHien;
    private String tuTrangThai;
    private String sangTrangThai;
    private String ghiChu;
}