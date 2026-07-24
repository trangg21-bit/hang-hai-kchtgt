package com.hanghai.kchtg.radarstation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "radar_station_attachment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadarStationAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "radar_station_id", nullable = false)
    private java.util.UUID radarStationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "radar_station_id", insertable = false, updatable = false)
    private RadarStation radarStation;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;

    @Column(name = "uploaded_date")
    private LocalDateTime uploadedDate;
}
