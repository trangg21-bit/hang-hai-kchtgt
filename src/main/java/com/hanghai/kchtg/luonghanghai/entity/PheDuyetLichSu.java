package com.hanghai.kchtg.luonghanghai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "phe_duyet_lich_su")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetLichSu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "luong_hang_hai_id", nullable = false)
    private LuongHangHai luongHangHai;

    @Column(name = "cap_phe_duyet")
    private Integer capPheDuyet;

    @Column(name = "trang_thai", nullable = false, length = 30)
    private String trangThai;

    @Column(name = "nguoi_phe_duyet", nullable = false, length = 100)
    private String nguoiPheDuyet;

    @Column(name = "ngay_phe_duyet")
    private LocalDate ngayPheDuyet;

    @Column(name = "ly_do", length = 500)
    private String lyDo;
}
