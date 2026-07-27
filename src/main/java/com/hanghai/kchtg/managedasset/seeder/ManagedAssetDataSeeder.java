package com.hanghai.kchtg.managedasset.seeder;

import com.hanghai.kchtg.managedasset.entity.ManagedAsset;
import com.hanghai.kchtg.managedasset.repository.ManagedAssetRepository;
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
@Component("managedAssetDataSeeder")
@Order(4)
public class ManagedAssetDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ManagedAssetDataSeeder.class);

    private final ManagedAssetRepository managedAssetRepository;

    public ManagedAssetDataSeeder(ManagedAssetRepository managedAssetRepository) {
        this.managedAssetRepository = managedAssetRepository;
    }

    @Override
    public void run(String... args) {
        if (managedAssetRepository.count() > 0) {
            log.info("ts_ql table already has data — skipping seeder");
            return;
        }

        log.info("Seeding ts_ql table with sample KCHTGT management assets...");

        List<ManagedAsset> assets = List.of(
                // 1. Cảng biển Hải Phòng (CB)
                ManagedAsset.builder()
                        .assetGroup("CB")
                        .assetCode("CB-HPH-001")
                        .assetName("Cảng biển Hải Phòng")
                        .unitOfMeasure("Cảng")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2005)
                        .inServiceYear(2006)
                        .landArea(new BigDecimal("50000"))
                        .floorArea(new BigDecimal("25000"))
                        .originalCost(new BigDecimal("12000000000000"))
                        .residualValue(new BigDecimal("10800000000000"))
                        .accumulatedDepreciation(new BigDecimal("1200000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Cảng biển tổng hợp cấp quốc gia")
                        .declarationDate(LocalDate.of(2025, 4, 1))
                        .disposalMethod("Sử dụng")
                        .build(),

                // 2. Bến cảng Chùa Vẽ (BC)
                ManagedAsset.builder()
                        .assetGroup("BC")
                        .assetCode("BC-HPH-002")
                        .assetName("Bến cảng Chùa Vẽ")
                        .unitOfMeasure("Bến")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2010)
                        .inServiceYear(2012)
                        .landArea(new BigDecimal("15000"))
                        .floorArea(new BigDecimal("8000"))
                        .originalCost(new BigDecimal("3500000000000"))
                        .residualValue(new BigDecimal("2800000000000"))
                        .accumulatedDepreciation(new BigDecimal("700000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Bến tổng hợp chính tại khu vực Hải Phòng")
                        .declarationDate(LocalDate.of(2025, 4, 1))
                        .disposalMethod("Sử dụng")
                        .build(),

                // 3. Cầu cảng số 1 (CC)
                ManagedAsset.builder()
                        .assetGroup("CC")
                        .assetCode("CC-HPH-001")
                        .assetName("Cầu cảng số 1")
                        .unitOfMeasure("Cầu")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2015)
                        .inServiceYear(2016)
                        .landArea(new BigDecimal("5000"))
                        .floorArea(new BigDecimal("3500"))
                        .originalCost(new BigDecimal("800000000000"))
                        .residualValue(new BigDecimal("640000000000"))
                        .accumulatedDepreciation(new BigDecimal("160000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Cầu cảng container số 1")
                        .declarationDate(LocalDate.of(2025, 4, 1))
                        .disposalMethod("Sử dụng")
                        .build(),

                // 4. Đèn biển Bạch Long Vĩ (DBNT)
                ManagedAsset.builder()
                        .assetGroup("DBNT")
                        .assetCode("DB-BLV-001")
                        .assetName("Đèn biển Bạch Long Vĩ")
                        .unitOfMeasure("Hệ thống")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2008)
                        .inServiceYear(2009)
                        .originalCost(new BigDecimal("150000000000"))
                        .residualValue(new BigDecimal("120000000000"))
                        .accumulatedDepreciation(new BigDecimal("30000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Đèn biển dẫn đường cấp 1")
                        .declarationDate(LocalDate.of(2025, 4, 1))
                        .disposalMethod("Sử dụng")
                        .build(),

                // 5. Phao tiêu số 12 (PT)
                ManagedAsset.builder()
                        .assetGroup("PT")
                        .assetCode("PT-HPH-012")
                        .assetName("Phao tiêu số 12")
                        .unitOfMeasure("Quả")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2018)
                        .inServiceYear(2018)
                        .originalCost(new BigDecimal("5000000000"))
                        .residualValue(new BigDecimal("4500000000"))
                        .accumulatedDepreciation(new BigDecimal("500000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Phao tiêu báo hiệu luồng hàng hải")
                        .declarationDate(LocalDate.of(2025, 4, 1))
                        .disposalMethod("Sử dụng")
                        .build(),

                // 6. Hệ thống VTS Hải Phòng (VTS)
                ManagedAsset.builder()
                        .assetGroup("VTS")
                        .assetCode("VTS-HPH-001")
                        .assetName("Hệ thống VTS Hải Phòng")
                        .unitOfMeasure("Hệ thống")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2014)
                        .inServiceYear(2015)
                        .floorArea(new BigDecimal("1200"))
                        .originalCost(new BigDecimal("5000000000000"))
                        .residualValue(new BigDecimal("4500000000000"))
                        .accumulatedDepreciation(new BigDecimal("500000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Hệ thống giám sát và điều phối giao thông hàng hải")
                        .declarationDate(LocalDate.of(2025, 4, 1))
                        .disposalMethod("Cho thuê")
                        .build(),

                // 7. Luồng hàng hải Sài Gòn - Vũng Tàu (LHH)
                ManagedAsset.builder()
                        .assetGroup("LHH")
                        .assetCode("LHH-SGN-VT-001")
                        .assetName("Luồng hàng hải Sài Gòn - Vũng Tàu")
                        .unitOfMeasure("Luồng")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2000)
                        .inServiceYear(2001)
                        .landArea(new BigDecimal("250000"))
                        .originalCost(new BigDecimal("25000000000000"))
                        .residualValue(new BigDecimal("20000000000000"))
                        .accumulatedDepreciation(new BigDecimal("5000000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Luồng hàng hải quốc gia, chiều dài 60 hải lý")
                        .declarationDate(LocalDate.of(2025, 6, 1))
                        .disposalMethod("Cho thuê")
                        .build(),

                // 8. Bến phao số 3 (BP)
                ManagedAsset.builder()
                        .assetGroup("BP")
                        .assetCode("BP-DNG-003")
                        .assetName("Bến phao số 3 - Đà Nẵng")
                        .unitOfMeasure("Bến")
                        .quantity(BigDecimal.ONE)
                        .constructionYear(2016)
                        .inServiceYear(2017)
                        .originalCost(new BigDecimal("250000000000"))
                        .residualValue(new BigDecimal("225000000000"))
                        .accumulatedDepreciation(new BigDecimal("25000000000"))
                        .assetCondition("Đang hoạt động tốt")
                        .notes("Bến phao neo đậu chờ làm hàng")
                        .declarationDate(LocalDate.of(2025, 6, 1))
                        .disposalMethod("Cho thuê")
                        .build()
        );

        managedAssetRepository.saveAll(assets);
        log.info("Seeded {} assets into ts_ql table", assets.size());
    }
}
