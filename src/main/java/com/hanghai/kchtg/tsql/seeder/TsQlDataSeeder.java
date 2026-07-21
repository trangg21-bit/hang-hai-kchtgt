package com.hanghai.kchtg.tsql.seeder;

import com.hanghai.kchtg.tsql.entity.TsQl;
import com.hanghai.kchtg.tsql.repository.TsQlRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Seeds the ts_ql table with realistic sample data covering all major KCHTGT asset groups.
 * <p>
 * Data is conditional — only inserted if the ts_ql table is empty.
 * Values are in VND (đồng).
 * </p>
 */
@Component("tsQlDataSeeder")
@Order(4)
public class TsQlDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TsQlDataSeeder.class);

    private final TsQlRepository tsQlRepository;

    public TsQlDataSeeder(TsQlRepository tsQlRepository) {
        this.tsQlRepository = tsQlRepository;
    }

    @Override
    public void run(String... args) {
        if (tsQlRepository.count() > 0) {
            log.info("ts_ql table already has data — skipping seeder");
            return;
        }

        log.info("Seeding ts_ql table with sample KCHTGT management assets...");

        List<TsQl> assets = List.of(
                // 1. Cảng biển Hải Phòng (CB)
                TsQl.builder()
                        .nhom("CB")
                        .tsMa("CB-HPH-001")
                        .tsTen("Cảng biển Hải Phòng")
                        .donViTinh("Cảng")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2005)
                        .namSuDung(2006)
                        .dienTichDat(new BigDecimal("50000"))
                        .sanSuDung(new BigDecimal("25000"))
                        .nguyenGia(new BigDecimal("12000000000000"))
                        .giaTriConLai(new BigDecimal("10800000000000"))
                        .haoMonLuyKe(new BigDecimal("1200000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Cảng biển tổng hợp cấp quốc gia")
                        .ngayKeKhai(LocalDate.of(2025, 4, 1))
                        .hinhThucXuLy("Sử dụng")
                        .build(),

                // 2. Bến cảng Chùa Vẽ (BC)
                TsQl.builder()
                        .nhom("BC")
                        .tsMa("BC-HPH-002")
                        .tsTen("Bến cảng Chùa Vẽ")
                        .donViTinh("Bến")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2010)
                        .namSuDung(2012)
                        .dienTichDat(new BigDecimal("15000"))
                        .sanSuDung(new BigDecimal("8000"))
                        .nguyenGia(new BigDecimal("3500000000000"))
                        .giaTriConLai(new BigDecimal("2800000000000"))
                        .haoMonLuyKe(new BigDecimal("700000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Bến tổng hợp chính tại khu vực Hải Phòng")
                        .ngayKeKhai(LocalDate.of(2025, 4, 1))
                        .hinhThucXuLy("Sử dụng")
                        .build(),

                // 3. Cầu cảng số 1 (CC)
                TsQl.builder()
                        .nhom("CC")
                        .tsMa("CC-HPH-001")
                        .tsTen("Cầu cảng số 1")
                        .donViTinh("Cầu")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2015)
                        .namSuDung(2016)
                        .dienTichDat(new BigDecimal("5000"))
                        .sanSuDung(new BigDecimal("3500"))
                        .nguyenGia(new BigDecimal("800000000000"))
                        .giaTriConLai(new BigDecimal("640000000000"))
                        .haoMonLuyKe(new BigDecimal("160000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Cầu cảng container số 1")
                        .ngayKeKhai(LocalDate.of(2025, 4, 1))
                        .hinhThucXuLy("Sử dụng")
                        .build(),

                // 4. Đèn biển Bạch Long Vĩ (DBNT)
                TsQl.builder()
                        .nhom("DBNT")
                        .tsMa("DB-BLV-001")
                        .tsTen("Đèn biển Bạch Long Vĩ")
                        .donViTinh("Hệ thống")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2008)
                        .namSuDung(2009)
                        .nguyenGia(new BigDecimal("150000000000"))
                        .giaTriConLai(new BigDecimal("120000000000"))
                        .haoMonLuyKe(new BigDecimal("30000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Đèn biển dẫn đường cấp 1")
                        .ngayKeKhai(LocalDate.of(2025, 4, 1))
                        .hinhThucXuLy("Sử dụng")
                        .build(),

                // 5. Phao tiêu số 12 (PT)
                TsQl.builder()
                        .nhom("PT")
                        .tsMa("PT-HPH-012")
                        .tsTen("Phao tiêu số 12")
                        .donViTinh("Quả")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2018)
                        .namSuDung(2018)
                        .nguyenGia(new BigDecimal("5000000000"))
                        .giaTriConLai(new BigDecimal("4500000000"))
                        .haoMonLuyKe(new BigDecimal("500000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Phao tiêu báo hiệu luồng hàng hải")
                        .ngayKeKhai(LocalDate.of(2025, 4, 1))
                        .hinhThucXuLy("Sử dụng")
                        .build(),

                // 6. Hệ thống VTS Hải Phòng (VTS)
                TsQl.builder()
                        .nhom("VTS")
                        .tsMa("VTS-HPH-001")
                        .tsTen("Hệ thống VTS Hải Phòng")
                        .donViTinh("Hệ thống")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2014)
                        .namSuDung(2015)
                        .sanSuDung(new BigDecimal("1200"))
                        .nguyenGia(new BigDecimal("5000000000000"))
                        .giaTriConLai(new BigDecimal("4500000000000"))
                        .haoMonLuyKe(new BigDecimal("500000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Hệ thống giám sát và điều phối giao thông hàng hải")
                        .ngayKeKhai(LocalDate.of(2025, 4, 1))
                        .hinhThucXuLy("Cho thuê")
                        .build(),

                // 7. Luồng hàng hải Sài Gòn - Vũng Tàu (LHH)
                TsQl.builder()
                        .nhom("LHH")
                        .tsMa("LHH-SGN-VT-001")
                        .tsTen("Luồng hàng hải Sài Gòn - Vũng Tàu")
                        .donViTinh("Luồng")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2000)
                        .namSuDung(2001)
                        .dienTichDat(new BigDecimal("250000"))
                        .nguyenGia(new BigDecimal("25000000000000"))
                        .giaTriConLai(new BigDecimal("20000000000000"))
                        .haoMonLuyKe(new BigDecimal("5000000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Luồng hàng hải quốc gia, chiều dài 60 hải lý")
                        .ngayKeKhai(LocalDate.of(2025, 6, 1))
                        .hinhThucXuLy("Cho thuê")
                        .build(),

                // 8. Bến phao số 3 (BP)
                TsQl.builder()
                        .nhom("BP")
                        .tsMa("BP-DNG-003")
                        .tsTen("Bến phao số 3 - Đà Nẵng")
                        .donViTinh("Bến")
                        .soLuong(BigDecimal.ONE)
                        .namXayDung(2016)
                        .namSuDung(2017)
                        .nguyenGia(new BigDecimal("250000000000"))
                        .giaTriConLai(new BigDecimal("225000000000"))
                        .haoMonLuyKe(new BigDecimal("25000000000"))
                        .tinhTrang("Đang hoạt động tốt")
                        .ghiChu("Bến phao neo đậu chờ làm hàng")
                        .ngayKeKhai(LocalDate.of(2025, 6, 1))
                        .hinhThucXuLy("Cho thuê")
                        .build()
        );

        tsQlRepository.saveAll(assets);
        log.info("Seeded {} assets into ts_ql table", assets.size());
    }
}
