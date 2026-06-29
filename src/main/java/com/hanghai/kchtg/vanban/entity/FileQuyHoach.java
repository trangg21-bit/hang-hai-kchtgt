package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * File quy hoạch — planning document attachments.
 * Used by F-132 Quản lý quy hoạch bến cảng.
 */
@Entity
@Table(name = "file_quy_hoach")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileQuyHoach {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quy_hoach_id")
    private Long quyHoachId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quy_hoach_id", insertable = false, updatable = false)
    private QuyHoachBenCang quyHoach;

    @Column(name = "ten_file", length = 300)
    private String tenFile;

    @Column(name = "loai_file", length = 50)
    private String loaiFile;

    @Column(name = "duong_dan", length = 500)
    private String duongDan;

    @Column(name = "kich_thuoc")
    private Long kichThuoc;

    @Column(name = "ngay_tai_len", updatable = false)
    private LocalDateTime ngayTaiLen;

    @PrePersist
    protected void onCreate() {
        this.ngayTaiLen = LocalDateTime.now();
    }
}
