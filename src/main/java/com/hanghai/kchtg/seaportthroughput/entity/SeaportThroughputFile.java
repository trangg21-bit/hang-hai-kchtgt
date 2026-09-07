package com.hanghai.kchtg.seaportthroughput.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * File đính kèm của bản ghi sản lượng cảng biển (M-028 / F-301) — bảng con seaport_throughput_file.
 * Chỉ audit (BaseEntity), không tham gia quy trình phê duyệt.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "seaport_throughput_file")
public class SeaportThroughputFile extends BaseEntity {

    @Column(name = "throughput_id", nullable = false)
    private UUID throughputId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type", length = 100)
    private String fileType;
}
