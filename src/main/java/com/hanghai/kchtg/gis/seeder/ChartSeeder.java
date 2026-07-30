package com.hanghai.kchtg.gis.seeder;

import com.hanghai.kchtg.gis.entity.ChartCell;
import com.hanghai.kchtg.gis.repository.ChartCellRepository;
import com.hanghai.kchtg.gis.repository.ChartFeatureRepository;
import com.hanghai.kchtg.gis.service.ChartIntegrationService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.io.InputStream;

/**
 * Automatically seeds the database with the electronic chart cell (.000) files
 * located in classpath:charts/ on application startup if they do not already
 * exist.
 */
@Component
@Profile({"local", "prod"})
@RequiredArgsConstructor
@Slf4j
public class ChartSeeder implements CommandLineRunner {

    private final ChartIntegrationService chartIntegrationService;
    private final ChartCellRepository cellRepository;
    private final ChartFeatureRepository featureRepository;
    private final EntityManager entityManager;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void run(String... args) throws Exception {
        log.info("Khởi chạy ChartSeeder - Tự động quét và import các mảnh hải đồ từ classpath...");

        var definition = new DefaultTransactionDefinition();
        var txStatus = transactionManager.getTransaction(definition);

        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources;
        try {
            resources = resolver.getResources("classpath:charts_json/*.json");
        } catch (Exception e) {
            log.warn("Không thể quét thư mục classpath:charts_json/*.json: {}", e.getMessage());
            return;
        }

        if (resources == null || resources.length == 0) {
            log.warn("Không tìm thấy tệp tin hải đồ (.json) nào trong thư mục classpath:charts_json/");
            return;
        }

        log.info("Tìm thấy {} tệp hải đồ (.json) trong classpath. Bắt đầu đối chiếu với cơ sở dữ liệu...",
                resources.length);

        int importedCount = 0;
        int skippedCount = 0;

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) {
                continue;
            }

            String cellName = filename.toUpperCase().replace(".JSON", "");

            // Check if this cell is already imported with actual S-57 features
            java.util.Optional<ChartCell> existingCell = cellRepository
                    .findByCellName(cellName);
            if (existingCell.isPresent() && featureRepository.existsByCellId(existingCell.get().getId())) {
                skippedCount++;
                continue;
            }

            try (InputStream is = resource.getInputStream()) {
                byte[] fileBytes = is.readAllBytes();
                chartIntegrationService.importS57(fileBytes, filename);
                importedCount++;
                if (importedCount % 20 == 0) {
                    entityManager.flush();
                    entityManager.clear();
                    log.debug("Flushed and cleared persistence context after {} imported cells", importedCount);
                }
                if (importedCount % 10 == 0 || importedCount == resources.length - skippedCount) {
                    log.info("Đã import thành công {} mảnh hải đồ...", importedCount);
                }
            } catch (Exception e) {
                log.error("Không thể import tệp hải đồ {} từ classpath: {}", filename, e.getMessage());
            }
        }

        transactionManager.commit(txStatus);
        log.info("Hoàn tất tiến trình seeder hải đồ. Đã import mới: {} mảnh, Đã bỏ qua (trùng lặp): {} mảnh.",
                importedCount, skippedCount);
    }
}
