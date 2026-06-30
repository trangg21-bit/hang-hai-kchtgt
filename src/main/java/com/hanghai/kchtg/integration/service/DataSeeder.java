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
@Profile("local")
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
        if (pointRepository.count() > 0 || lineRepository.count() > 0 || polygonRepository.count() > 0) {
            log.info("Seed data already exists - skipping.");
            return;
        }

        log.info("Seeding Wave-1 KCHTGT chart data...");

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

        log.info("Seeding Wave-3 Port and Cargo aggregate data...");

        PortStatus hpStatus = PortStatus.builder()
                .portCode("PIER-HPH-001")
                .portName("Cảng Hải Phòng")
                .berthCount(15)
                .operationalStatus("ACTIVE")
                .currentCapacityTons(10000000.0)
                .build();
        portStatusRepository.save(hpStatus);

        PortStatus dnStatus = PortStatus.builder()
                .portCode("BEACON-DAD-001")
                .portName("Cảng Đà Nẵng")
                .berthCount(8)
                .operationalStatus("ACTIVE")
                .currentCapacityTons(5000000.0)
                .build();
        portStatusRepository.save(dnStatus);

        CargoAggregate hpAnnual = CargoAggregate.builder()
                .portCode("PIER-HPH-001")
                .periodType("ANNUAL")
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 12, 31))
                .totalTons(BigDecimal.valueOf(8000000.00))
                .totalTeus(BigDecimal.valueOf(450000.00))
                .vesselCount(1200)
                .build();
        cargoRepository.save(hpAnnual);

        CargoAggregate hpMonthly = CargoAggregate.builder()
                .portCode("PIER-HPH-001")
                .periodType("MONTHLY")
                .periodStart(LocalDate.of(2026, 5, 1))
                .periodEnd(LocalDate.of(2026, 5, 31))
                .totalTons(BigDecimal.valueOf(750000.00))
                .totalTeus(BigDecimal.valueOf(42000.00))
                .vesselCount(110)
                .build();
        cargoRepository.save(hpMonthly);

        CargoAggregate dnAnnual = CargoAggregate.builder()
                .portCode("BEACON-DAD-001")
                .periodType("ANNUAL")
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 12, 31))
                .totalTons(BigDecimal.valueOf(3500000.00))
                .totalTeus(BigDecimal.valueOf(180000.00))
                .vesselCount(600)
                .build();
        cargoRepository.save(dnAnnual);

        log.info("Wave-1 & Wave-3 seed complete: {} points, {} lines, {} polygons, {} port statuses, {} cargo aggregates",
                pointRepository.count(), lineRepository.count(), polygonRepository.count(),
                portStatusRepository.count(), cargoRepository.count());
    }
}
