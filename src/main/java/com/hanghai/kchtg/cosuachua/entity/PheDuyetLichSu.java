package com.hanghai.kchtg.cosuachua.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "phe_duyet_lich_su")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetLichSu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "co_sua_chua_id", nullable = false)
    private Long coSuaChuaId;

    @Column(name = "cap_phe_duyet", nullable = false)
    private Integer capPheDuyet;

    @Column(name = "trang_thai", nullable = false, length = 30)
    private String trangThai;

    @Column(name = "nguoi_phe_duyet", nullable = false, length = 100)
    private String nguoiPheDuyet;

    @CreatedDate
    @Column(name = "ngay_phe_duyet", nullable = false, updatable = false)
    private LocalDateTime ngayPheDuyet;

    @Column(name = "ly_do", length = 500)
    private String lyDo;
}
