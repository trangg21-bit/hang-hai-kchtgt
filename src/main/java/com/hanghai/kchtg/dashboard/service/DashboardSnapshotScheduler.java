package com.hanghai.kchtg.dashboard.service;

import com.hanghai.kchtg.dashboard.entity.DashboardSnapshot;
import com.hanghai.kchtg.dashboard.entity.DashboardSnapshotDetail;
import com.hanghai.kchtg.dashboard.repository.DashboardSnapshotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardSnapshotScheduler {

    private static final Logger log = LoggerFactory.getLogger(DashboardSnapshotScheduler.class);

    private final KchtAssetCountService kchtService;
    private final DashboardSnapshotRepository snapshotRepo;
    private final JdbcTemplate jdbc;

    public DashboardSnapshotScheduler(KchtAssetCountService kchtService, DashboardSnapshotRepository snapshotRepo, JdbcTemplate jdbc) {
        this.kchtService = kchtService;
        this.snapshotRepo = snapshotRepo;
        this.jdbc = jdbc;
    }

    // Chạy ngầm tự động vào lúc 23:59:00 ngày 31/12 hàng năm
    @Scheduled(cron = "0 59 23 31 12 ?")
    @Transactional
    public void takeYearlySnapshot() {
        int currentYear = LocalDate.now().getYear();
        log.info("Bắt đầu tự động chốt sổ Snapshot Dashboard cho năm {}", currentYear);
        takeSnapshotForYear(currentYear);
        log.info("Hoàn thành tự động chốt sổ Snapshot Dashboard cho năm {}", currentYear);
    }

    // Hàm public này có thể gọi thủ công qua REST API của Admin (nếu cần backfill dữ liệu cũ)
    @Transactional
    public void takeSnapshotForYear(int year) {
        // Lấy toàn bộ 63 ID của tỉnh thành
        List<Integer> provinceIds = jdbc.queryForList("SELECT id FROM provinces", Integer.class);
        provinceIds.add(null); // Bổ sung giá trị null để đại diện cho "Toàn quốc"

        for (Integer provinceId : provinceIds) {
            // Xóa bản ghi Snapshot cũ (nếu có) để tránh trùng lặp khi chạy lại
            if (provinceId == null) {
                snapshotRepo.findByYearNational(year).ifPresent(snapshotRepo::delete);
            } else {
                snapshotRepo.findByYearAndProvince(year, provinceId).ifPresent(snapshotRepo::delete);
            }

            // Flush để xóa hoàn toàn khỏi JPA Session
            snapshotRepo.flush();

            // Tính toán số liệu Live của năm đó. 
            // Nhờ cơ chế Fallback đã code trong KchtAssetCountService, khi Snapshot vừa bị xóa, hệ thống sẽ tự quét lại vào bảng Live KCHT.
            long totalCount = kchtService.countTotal(year, provinceId);
            long operatingCount = kchtService.countOperating(year, provinceId);
            List<Map<String, Object>> breakdown = kchtService.getInfraTableData(year, provinceId);

            // Khởi tạo thực thể Bảng Cha
            DashboardSnapshot snapshot = new DashboardSnapshot();
            snapshot.setId(UUID.randomUUID());
            snapshot.setSnapshotYear(year);
            snapshot.setProvinceId(provinceId);
            snapshot.setTotalCount(totalCount);
            snapshot.setOperatingCount(operatingCount);
            snapshot.setCreatedAt(java.time.LocalDateTime.now());

            // Khởi tạo các thực thể Bảng Con (Chi tiết 19 loại KCHT)
            for (Map<String, Object> row : breakdown) {
                DashboardSnapshotDetail detail = new DashboardSnapshotDetail();
                detail.setId(UUID.randomUUID());
                detail.setSnapshot(snapshot);
                detail.setKchtType((String) row.get("type"));
                
                // An toàn ép kiểu từ Object sang Long
                detail.setTotalCount(((Number) row.get("total")).longValue());
                detail.setOperatingCount(((Number) row.get("operating")).longValue());
                detail.setPendingCount(((Number) row.get("pending")).longValue());
                detail.setSuspendedCount(((Number) row.get("suspended")).longValue());
                detail.setSequenceNo((Integer) row.get("sequenceNo"));
                
                // Móc quan hệ vào bảng Cha
                snapshot.getDetails().add(detail);
            }

            // Lưu toàn bộ vào Database (JPA sẽ tự động lưu mảng Chi tiết nhờ CascadeType.ALL)
            snapshotRepo.save(snapshot);
        }
    }
}
