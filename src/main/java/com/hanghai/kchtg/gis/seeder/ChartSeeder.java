package com.hanghai.kchtg.gis.seeder;

import com.hanghai.kchtg.gis.repository.ChartCellRepository;
import com.hanghai.kchtg.gis.service.ChartIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.InputStream;

/**
 * Automatically seeds the database with the electronic chart cell (.000) files
 * located in classpath:charts/ on application startup if they do not already exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChartSeeder implements CommandLineRunner {

    private final ChartIntegrationService chartIntegrationService;
    private final ChartCellRepository cellRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("Khởi chạy ChartSeeder - Tự động quét và import các mảnh hải đồ từ classpath...");

        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources;
        try {
            resources = resolver.getResources("classpath:charts/*.000");
        } catch (Exception e) {
            log.warn("Không thể quét thư mục classpath:charts/*.000: {}", e.getMessage());
            return;
        }

        if (resources == null || resources.length == 0) {
            log.warn("Không tìm thấy tệp tin hải đồ (.000) nào trong thư mục classpath:charts/");
            return;
        }

        log.info("Tìm thấy {} tệp hải đồ (.000) trong classpath. Bắt đầu đối chiếu với cơ sở dữ liệu...", resources.length);

        int importedCount = 0;
        int skippedCount = 0;

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) {
                continue;
            }

            String cellName = filename.toUpperCase().replace(".000", "");

            // Check if this cell is already imported
            if (cellRepository.findByCellName(cellName).isPresent()) {
                skippedCount++;
                continue;
            }

            try (InputStream is = resource.getInputStream()) {
                byte[] fileBytes = is.readAllBytes();
                chartIntegrationService.importS57(fileBytes, filename);
                importedCount++;
                if (importedCount % 10 == 0 || importedCount == resources.length - skippedCount) {
                    log.info("Đã import thành công {} mảnh hải đồ...", importedCount);
                }
            } catch (Exception e) {
                log.error("Không thể import tệp hải đồ {} từ classpath: {}", filename, e.getMessage());
            }
        }

        log.info("Hoàn tất tiến trình seeder hải đồ. Đã import mới: {} mảnh, Đã bỏ qua (trùng lặp): {} mảnh.",
                importedCount, skippedCount);
    }
}

