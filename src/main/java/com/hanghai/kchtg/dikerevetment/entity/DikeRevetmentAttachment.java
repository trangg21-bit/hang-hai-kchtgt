package com.hanghai.kchtg.dikerevetment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "dike_revetment_attachment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dike_revetment_id", nullable = false)
    private DikeRevetment dikeRevetment;

    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "loai_tai_lieu", length = 100)
    private String loaiTaiLieu;

    @Column(name = "nguoi_tai_len", length = 100)
    private String nguoiTaiLen;

    @Column(name = "upload_date")
    private LocalDate uploadDate;
}
