package com.hanghai.kchtg.luonghanghai.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChiTietTuyenLuongResponse {
    private UUID id;
    private Integer stt;
    private String phanLoai;
    private String ma;
    private String ten;
    private Integer loaiTuyenLuong;
    private String doSauHienTai;
    private String maiDocThietKe;
    private BigDecimal chieuDai;
    private BigDecimal rongLonNhat;
    private BigDecimal rongNhoNhat;
    private BigDecimal doSau;
    private BigDecimal khoiLuongNaoVet;
    private Boolean congCong;
    private Boolean chuyenDung;
    private String chieuCaoTinhKhong;
    private String viTriVungQuayTau;
    private java.math.BigDecimal banKinhVungQuayTau;
    private java.math.BigDecimal banKinhCongNhoNhat;
    private String phamViBaoVeLuong;
}
