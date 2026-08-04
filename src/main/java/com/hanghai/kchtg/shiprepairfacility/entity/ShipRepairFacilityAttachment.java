package com.hanghai.kchtg.shiprepairfacility.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ship_repair_facility_attachment")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ship_repair_facility_id", nullable = false)
    private ShipRepairFacility shipRepairFacility;

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

    @CreatedDate
    @Column(name = "uploaded_date")
    private LocalDateTime uploadedDate;
}
