package com.hanghai.kchtg.beacon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Entity representing nautical beacon light equipment (lighthouse, beacon light, beacon mark).
 * Extends BaseEntity for shared audit fields and soft-delete support.
 */
@Entity
@Table(name = "den_bien")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconLight extends BaseEntity {

    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    @Column(name = "ma_den_bien", nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    @Column(name = "ten_den_bien", nullable = false, length = 255)
    private String name;

    @Column(name = "cap_tram_den", nullable = false)
    @Convert(converter = BeaconLightTypeConverter.class)
    private BeaconLightType type;

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    @Column(name = "vi_do", nullable = false)
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    @Column(name = "kinh_do", nullable = false)
    private Double longitude;

    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("60.0")
    @Column(name = "tam_hieu_luc_anh_sang", nullable = false)
    private Double lightRange;

    @Size(max = 50)
    @Column(name = "mau_sac_ben_ngoai_cua_thap_den", length = 500)
    private String lightColor;

    @Size(max = 100)
    @Column(name = "chung_loai_den_chinh", length = 100)
    private String lightCharacteristic;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    @Column(name = "dien_tich")
    private Double range;

    @Size(max = 1000)
    @Column(name = "dia_diem_dat_tram_den", length = 500)
    private String description;

    @Column(name = "unit_id")
    private java.util.UUID unitId;

    @Column(name = "thoi_diem_sua_chua_gan_nhat")
    private LocalDate lastMaintenanceDate;

    @Column(name = "thoi_diem_dua_vao_su_dung")
    private LocalDate nextMaintenanceDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Convert(converter = BeaconStatusConverter.class)
    @Builder.Default
    private BeaconStatus status = BeaconStatus.DRAFT;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = BeaconApprovalStatusConverter.class)
    @Builder.Default
    private BeaconApprovalStatus approvalStatus = BeaconApprovalStatus.PENDING;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_date")
    private java.time.LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "spatial_id")
    private java.util.UUID khongGianId;

    @Column(name = "hinh_dang", length = 255)
    private String hinhDang;

    @Column(name = "ket_cau", length = 2000)
    private String ketCau;

    @Column(name = "chieu_cao_thap_den")
    private Double chieuCaoThapDen;

    @Column(name = "chieu_cao_tam_sang")
    private Double chieuCaoTamSang;

    @Column(name = "tam_hieu_luc_dia_ly", length = 20)
    private String tamHieuLucDiaLy;

    @Column(name = "chung_loai_den_du_phong", length = 100)
    private String chungLoaiDenDuPhong;

    @Column(name = "nguon_cung_cap_nang_luong_cho_den", length = 500)
    private String nguonCungCapNangLuongChoDen;

    @Column(name = "so_luong_nhan_su_bo_tri")
    private Integer soLuongNhanSuBoTri;

    @Column(name = "dien_tich_su_dung_tram")
    private Double dienTichSuDungTram;
}
