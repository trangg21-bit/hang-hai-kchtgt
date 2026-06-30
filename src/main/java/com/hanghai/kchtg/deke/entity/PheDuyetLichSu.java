package com.hanghai.kchtg.deke.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity(name = "DeKePheDuyetLichSu")
@Table(name = "phe_duyet_lich_su_de_ke")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetLichSu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_ke_id", nullable = false)
    private DeKe deKe;

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
