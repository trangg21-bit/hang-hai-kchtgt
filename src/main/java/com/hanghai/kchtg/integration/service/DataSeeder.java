package com.hanghai.kchtg.integration.service;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.integration.entity.CargoAggregate;
import com.hanghai.kchtg.integration.entity.PortStatus;
import com.hanghai.kchtg.integration.repository.CargoAggregateRepository;
import com.hanghai.kchtg.integration.repository.PortStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component("integrationDataSeeder")
@Order(3)
@Profile({"local", "prod"})
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final PointObjectRepository pointRepository;
    private final LineObjectRepository lineRepository;
    private final PolygonObjectRepository polygonRepository;
    private final PortStatusRepository portStatusRepository;
    private final CargoAggregateRepository cargoRepository;

    public DataSeeder(PointObjectRepository pointRepository,
                      LineObjectRepository lineRepository,
                      PolygonObjectRepository polygonRepository,
                      PortStatusRepository portStatusRepository,
                      CargoAggregateRepository cargoRepository) {
        this.pointRepository = pointRepository;
        this.lineRepository = lineRepository;
        this.polygonRepository = polygonRepository;
        this.portStatusRepository = portStatusRepository;
        this.cargoRepository = cargoRepository;
    }

    @Override
    public void run(String... args) {
        seed();
    }

    public void seed() {
        log.info("Seeding Wave-1 KCHTGT chart data...");

        if (pointRepository.countByCodeIncludingDeleted("PIER-HPH-001") == 0) {
            PointObject pier = PointObject.builder()
                    .code("PIER-HPH-001")
                    .name("Bến cảng Hải Phòng")
                    .objectType(PointObject.ObjectType.PORT)
                    .latitude(20.8449)
                    .longitude(106.6881)
                    .description("Bến cảng nước sâu chính tại Hải Phòng")
                    .status(PointObject.Status.PUBLISHED)
                    .approvalStatus(PointObject.ApprovalStatus.APPROVED)
                    .build();
            pointRepository.save(pier);
        }

        if (lineRepository.countByCodeIncludingDeleted("BRG-DNG-001") == 0) {
            LineObject bridge = LineObject.builder()
                    .code("BRG-DNG-001")
                    .name("Cầu Đà Nẵng")
                    .objectType(LineObject.ObjectType.WATERWAY)
                    .coordinates("LINESTRING(108.2022 16.0544, 108.2296 16.0630)")
                    .description("Tuyến cầu qua cửa sông Đà Nẵng")
                    .status(LineObject.Status.PUBLISHED)
                    .approvalStatus(LineObject.ApprovalStatus.APPROVED)
                    .build();
            lineRepository.save(bridge);
        }

        if (pointRepository.countByCodeIncludingDeleted("BUOY-BTH-001") == 0) {
            PointObject buoyBerth = PointObject.builder()
                    .code("BUOY-BTH-001")
                    .name("Bến phao số 1")
                    .objectType(PointObject.ObjectType.BUOY)
                    .latitude(10.7769)
                    .longitude(106.7004)
                    .description("Phao tiêu tại bến cảng Nha Trang")
                    .status(PointObject.Status.PUBLISHED)
                    .approvalStatus(PointObject.ApprovalStatus.APPROVED)
                    .build();
            pointRepository.save(buoyBerth);
        }

        if (pointRepository.countByCodeIncludingDeleted("BUOY-MKR-001") == 0) {
            PointObject buoyMarker = PointObject.builder()
                    .code("BUOY-MKR-001")
                    .name("Phao tiêu số 15")
                    .objectType(PointObject.ObjectType.BUOY)
                    .latitude(21.1710)
                    .longitude(107.1541)
                    .description("Phao tiêu kênh chính vịnh Hạ Long")
                    .status(PointObject.Status.PUBLISHED)
                    .approvalStatus(PointObject.ApprovalStatus.APPROVED)
                    .build();
            pointRepository.save(buoyMarker);
        }

        if (polygonRepository.countByCodeIncludingDeleted("STORM-QLG-001") == 0) {
            PolygonObject stormShelter = PolygonObject.builder()
                    .code("STORM-QLG-001")
                    .name("Khu tránh bão vịnh Hạ Long")
                    .objectType(PolygonObject.ObjectType.STORM_SHELTER)
                    .coordinates("POLYGON((107.10 20.90, 107.20 20.90, 107.20 21.00, 107.10 21.00, 107.10 20.90))")
                    .description("Khu neo tránh bão tại vịnh Hạ Long")
                    .status(PolygonObject.Status.PUBLISHED)
                    .approvalStatus(PolygonObject.ApprovalStatus.APPROVED)
                    .build();
            polygonRepository.save(stormShelter);
        }

        if (lineRepository.countByCodeIncludingDeleted("ROUTE-HPH-DAD-001") == 0) {
            LineObject transportRoute = LineObject.builder()
                    .code("ROUTE-HPH-DAD-001")
                    .name("Tuyến chuyển tải Hải Phòng Đà Nẵng")
                    .objectType(LineObject.ObjectType.SHIPPING_ROUTE)
                    .coordinates("LINESTRING(106.6881 20.8449, 108.2022 16.0544)")
                    .description("Tuyến chuyển tải giữa cảng Hải Phòng và Đà Nẵng")
                    .status(LineObject.Status.PUBLISHED)
                    .approvalStatus(LineObject.ApprovalStatus.APPROVED)
                    .build();
            lineRepository.save(transportRoute);
        }

        if (polygonRepository.countByCodeIncludingDeleted("ANCH-HPH-001") == 0) {
            PolygonObject anchorage = PolygonObject.builder()
                    .code("ANCH-HPH-001")
                    .name("Khu neo đậu Hải Phòng")
                    .objectType(PolygonObject.ObjectType.ANCHORAGE)
                    .coordinates("POLYGON((106.65 20.82, 106.72 20.82, 106.72 20.87, 106.65 20.87, 106.65 20.82))")
                    .description("Khu vực neo đậu tàu biển tại cảng Hải Phòng")
                    .status(PolygonObject.Status.PUBLISHED)
                    .approvalStatus(PolygonObject.ApprovalStatus.APPROVED)
                    .build();
            polygonRepository.save(anchorage);
        }

        if (pointRepository.countByCodeIncludingDeleted("REPAIR-HPH-001") == 0) {
            PointObject repairFacility = PointObject.builder()
                    .code("REPAIR-HPH-001")
                    .name("Cơ sở sửa chữa Hải Phòng")
                    .objectType(PointObject.ObjectType.OTHER)
                    .latitude(20.8500)
                    .longitude(106.6800)
                    .description("Xưởng sửa chữa tàu biển tại Hải Phòng")
                    .status(PointObject.Status.PUBLISHED)
                    .approvalStatus(PointObject.ApprovalStatus.APPROVED)
                    .build();
            pointRepository.save(repairFacility);
        }

        if (pointRepository.countByCodeIncludingDeleted("BEACON-DAD-001") == 0) {
            PointObject beacon = PointObject.builder()
                    .code("BEACON-DAD-001")
                    .name("Đèn biển Đà Nẵng")
                    .objectType(PointObject.ObjectType.BEACON)
                    .latitude(16.0470)
                    .longitude(108.2200)
                    .description("Đèn biển dẫn đường vào cảng Đà Nẵng")
                    .status(PointObject.Status.PUBLISHED)
                    .approvalStatus(PointObject.ApprovalStatus.APPROVED)
                    .build();
            pointRepository.save(beacon);
        }

        if (pointRepository.countByCodeIncludingDeleted("VTS-HPH-001") == 0) {
            PointObject vtsSystem = PointObject.builder()
                    .code("VTS-HPH-001")
                    .name("Hệ thống VTS Hải Phòng")
                    .objectType(PointObject.ObjectType.PORT)
                    .latitude(20.8550)
                    .longitude(106.6900)
                    .description("Trung tâm giám sát VTS tại cảng Hải Phòng")
                    .status(PointObject.Status.PUBLISHED)
                    .approvalStatus(PointObject.ApprovalStatus.APPROVED)
                    .build();
            pointRepository.save(vtsSystem);
        }

        // Generates 15 PointObjects
        for (int i = 1; i <= 15; i++) {
            String code = "POINT-GEN-" + String.format("%03d", i);
            if (pointRepository.countByCodeIncludingDeleted(code) == 0) {
                PointObject.Status status = PointObject.Status.values()[(i - 1) % PointObject.Status.values().length];
                PointObject.ObjectType type = PointObject.ObjectType.values()[(i - 1) % PointObject.ObjectType.values().length];
                
                PointObject.PointObjectBuilder builder = PointObject.builder()
                        .code(code)
                        .name("Đối tượng điểm số " + i)
                        .objectType(type)
                        .latitude(20.0 + (i * 0.1))
                        .longitude(106.0 + (i * 0.1))
                        .description("Mô tả đối tượng điểm tự động tạo số " + i)
                        .status(status)
                        .approvalStatus(status == PointObject.Status.PUBLISHED || status == PointObject.Status.APPROVED_L2 ? PointObject.ApprovalStatus.APPROVED : PointObject.ApprovalStatus.PENDING);
                
                if (status == PointObject.Status.DELETED) {
                    PointObject obj = builder.build();
                    obj.setDeletedAt(java.time.LocalDateTime.now());
                    pointRepository.save(obj);
                } else {
                    pointRepository.save(builder.build());
                }
            }
        }

        // Generates 15 LineObjects
        for (int i = 1; i <= 15; i++) {
            String code = "LINE-GEN-" + String.format("%03d", i);
            if (lineRepository.countByCodeIncludingDeleted(code) == 0) {
                LineObject.Status status = LineObject.Status.values()[(i - 1) % LineObject.Status.values().length];
                LineObject.ObjectType type = LineObject.ObjectType.values()[(i - 1) % LineObject.ObjectType.values().length];
                
                LineObject.LineObjectBuilder builder = LineObject.builder()
                        .code(code)
                        .name("Đối tượng đường số " + i)
                        .objectType(type)
                        .coordinates("LINESTRING(" + (106.0 + i * 0.1) + " " + (20.0 + i * 0.1) + ", " + (106.1 + i * 0.1) + " " + (20.1 + i * 0.1) + ")")
                        .description("Mô tả đối tượng đường tự động tạo số " + i)
                        .status(status)
                        .approvalStatus(status == LineObject.Status.PUBLISHED || status == LineObject.Status.APPROVED_L2 ? LineObject.ApprovalStatus.APPROVED : LineObject.ApprovalStatus.PENDING);
                
                if (status == LineObject.Status.DELETED) {
                    LineObject obj = builder.build();
                    obj.setDeletedAt(java.time.LocalDateTime.now());
                    lineRepository.save(obj);
                } else {
                    lineRepository.save(builder.build());
                }
            }
        }

        // Generates 15 PolygonObjects
        for (int i = 1; i <= 15; i++) {
            String code = "POLY-GEN-" + String.format("%03d", i);
            if (polygonRepository.countByCodeIncludingDeleted(code) == 0) {
                PolygonObject.Status status = PolygonObject.Status.values()[(i - 1) % PolygonObject.Status.values().length];
                PolygonObject.ObjectType type = PolygonObject.ObjectType.values()[(i - 1) % PolygonObject.ObjectType.values().length];
                
                double baseLon = 106.0 + i * 0.1;
                double baseLat = 20.0 + i * 0.1;
                String coords = String.format("POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))",
                        baseLon, baseLat,
                        baseLon + 0.05, baseLat,
                        baseLon + 0.05, baseLat + 0.05,
                        baseLon, baseLat + 0.05,
                        baseLon, baseLat);
                        
                PolygonObject.PolygonObjectBuilder builder = PolygonObject.builder()
                        .code(code)
                        .name("Đối tượng vùng số " + i)
                        .objectType(type)
                        .coordinates(coords)
                        .description("Mô tả đối tượng vùng tự động tạo số " + i)
                        .status(status)
                        .approvalStatus(status == PolygonObject.Status.PUBLISHED || status == PolygonObject.Status.APPROVED_L2 ? PolygonObject.ApprovalStatus.APPROVED : PolygonObject.ApprovalStatus.PENDING);
                
                if (status == PolygonObject.Status.DELETED) {
                    PolygonObject obj = builder.build();
                    obj.setDeletedAt(java.time.LocalDateTime.now());
                    polygonRepository.save(obj);
                } else {
                    polygonRepository.save(builder.build());
                }
            }
        }

        log.info("Seeding Wave-3 Port and Cargo aggregate data...");

        if (portStatusRepository.countByPortCodeIncludingDeleted("PIER-HPH-001") == 0) {
            PortStatus hpStatus = PortStatus.builder()
                    .portCode("PIER-HPH-001")
                    .portName("Cảng Hải Phòng")
                    .berthCount(15)
                    .operationalStatus("ACTIVE")
                    .currentCapacityTons(10000000.0)
                    .build();
            portStatusRepository.save(hpStatus);
        }

        if (portStatusRepository.countByPortCodeIncludingDeleted("BEACON-DAD-001") == 0) {
            PortStatus dnStatus = PortStatus.builder()
                    .portCode("BEACON-DAD-001")
                    .portName("Cảng Đà Nẵng")
                    .berthCount(8)
                    .operationalStatus("ACTIVE")
                    .currentCapacityTons(5000000.0)
                    .build();
            portStatusRepository.save(dnStatus);
        }

        LocalDate hpAnnualStart = LocalDate.of(2025, 1, 1);
        if (cargoRepository.countByPortCodeAndPeriodTypeAndPeriodStartIncludingDeleted("PIER-HPH-001", "ANNUAL", hpAnnualStart) == 0) {
            CargoAggregate hpAnnual = CargoAggregate.builder()
                    .portCode("PIER-HPH-001")
                    .periodType("ANNUAL")
                    .periodStart(hpAnnualStart)
                    .periodEnd(LocalDate.of(2025, 12, 31))
                    .totalTons(BigDecimal.valueOf(8000000.00))
                    .totalTeus(BigDecimal.valueOf(450000.00))
                    .vesselCount(1200)
                    .build();
            cargoRepository.save(hpAnnual);
        }

        LocalDate hpMonthlyStart = LocalDate.of(2026, 5, 1);
        if (cargoRepository.countByPortCodeAndPeriodTypeAndPeriodStartIncludingDeleted("PIER-HPH-001", "MONTHLY", hpMonthlyStart) == 0) {
            CargoAggregate hpMonthly = CargoAggregate.builder()
                    .portCode("PIER-HPH-001")
                    .periodType("MONTHLY")
                    .periodStart(hpMonthlyStart)
                    .periodEnd(LocalDate.of(2026, 5, 31))
                    .totalTons(BigDecimal.valueOf(750000.00))
                    .totalTeus(BigDecimal.valueOf(42000.00))
                    .vesselCount(110)
                    .build();
            cargoRepository.save(hpMonthly);
        }

        LocalDate dnAnnualStart = LocalDate.of(2025, 1, 1);
        if (cargoRepository.countByPortCodeAndPeriodTypeAndPeriodStartIncludingDeleted("BEACON-DAD-001", "ANNUAL", dnAnnualStart) == 0) {
            CargoAggregate dnAnnual = CargoAggregate.builder()
                    .portCode("BEACON-DAD-001")
                    .periodType("ANNUAL")
                    .periodStart(dnAnnualStart)
                    .periodEnd(LocalDate.of(2025, 12, 31))
                    .totalTons(BigDecimal.valueOf(3500000.00))
                    .totalTeus(BigDecimal.valueOf(180000.00))
                    .vesselCount(600)
                    .build();
            cargoRepository.save(dnAnnual);
        }

        log.info("Wave-1 & Wave-3 seed complete: {} points, {} lines, {} polygons, {} port statuses, {} cargo aggregates",
                pointRepository.count(), lineRepository.count(), polygonRepository.count(),
                portStatusRepository.count(), cargoRepository.count());
    }
}
