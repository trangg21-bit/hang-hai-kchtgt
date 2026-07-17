package com.hanghai.kchtg.orgunit.config;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup runner: seeds demo org hierarchy if DB is empty, then fixes missing parent_id.
 * Idempotent — safe to run on every startup.
 */
@Component
public class OrgUnitDataFixer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OrgUnitDataFixer.class);
    private final OrgUnitRepository repo;

    public OrgUnitDataFixer(OrgUnitRepository repo) { this.repo = repo; }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            long count = repo.count();
            log.info("OrgUnitDataFixer: {} org units in DB", count);

            // ── Phase 1: Seed demo data if empty ──
            if (count == 0) {
                seedDemoData();
                count = repo.count();
                log.info("OrgUnitDataFixer: seeded {} demo org units", count);
            }

            // ── Phase 2: Fix orphan parent_id ──
            fixOrphans();

        } catch (Exception e) {
            log.error("OrgUnitDataFixer: failed", e);
        }
    }

    private void seedDemoData() {
        // 1. Root: Cục Hàng hải và Đường thủy Việt Nam
        OrgUnit root = OrgUnit.builder()
                .name("Cục Hàng hải và Đường thủy Việt Nam")
                .code("CUC_HHVT")
                .type(OrgUnitType.CUC)
                .description("Đơn vị gốc - Cục Hàng hải và Đường thủy Việt Nam")
                .status(OrgUnitStatus.APPROVED)
                .parentId(null)
                .level(1)
                .path("")
                .sortOrder(0)
                .build();
        root = repo.save(root);

        // 2. Cảng vụ (level 2 under root)
        OrgUnit cvHp = child(root, "Cảng vụ Hàng hải Hải Phòng", "CV_HH_HP", OrgUnitType.CANG_VU, 1);
        OrgUnit cvQn = child(root, "Cảng vụ Hàng hải Quảng Ninh", "CV_HH_QN", OrgUnitType.CANG_VU, 2);
        child(root, "Cảng vụ Hàng hải TP. Hồ Chí Minh", "CV_HH_HCM", OrgUnitType.CANG_VU, 3);

        // 3. Đại diện (level 3 under Cảng vụ)
        child(cvHp, "Đại diện Cảng vụ Hải Phòng tại Đình Vũ", "DD_CVHP_DV", OrgUnitType.CANG_VU, 1);
        child(cvHp, "Đại diện Cảng vụ Hải Phòng tại Bạch Đằng", "DD_CVHP_BD", OrgUnitType.CANG_VU, 2);
        child(cvQn, "Đại diện Cảng vụ Quảng Ninh tại Móng Cái", "DD_CVQN_MC", OrgUnitType.CANG_VU, 1);
        child(cvQn, "Đại diện Cảng vụ Quảng Ninh tại Vân Đồn", "DD_CVQN_VD", OrgUnitType.CANG_VU, 2);

        log.info("OrgUnitDataFixer: seeded Cục HHVT + 3 Cảng vụ + 4 Đại diện");
    }

    private OrgUnit child(OrgUnit parent, String name, String code, OrgUnitType type, int sort) {
        OrgUnit child = OrgUnit.builder()
                .name(name)
                .code(code)
                .type(type)
                .description(name)
                .status(OrgUnitStatus.APPROVED)
                .parentId(parent.getId())
                .level(parent.getLevel() + 1)
                .path(parent.getPath() + parent.getId() + "/")
                .sortOrder(sort)
                .build();
        return repo.save(child);
    }

    private void fixOrphans() {
        // Find root CUC
        List<OrgUnit> roots = repo.findByParentIdIsNull().stream()
                .filter(u -> u.getType() == OrgUnitType.CUC)
                .toList();

        if (roots.isEmpty()) {
            log.info("OrgUnitDataFixer: no root CUC — skipping orphan fix");
            return;
        }

        OrgUnit root = roots.get(0);

        // Find orphan CANG_VU / CHI_CUC
        List<OrgUnit> orphans = repo.findByParentIdIsNull().stream()
                .filter(u -> u.getType() == OrgUnitType.CANG_VU || u.getType() == OrgUnitType.CHI_CUC)
                .filter(u -> !u.getId().equals(root.getId()))
                .toList();

        if (orphans.isEmpty()) {
            log.info("OrgUnitDataFixer: no orphans to fix");
            return;
        }

        for (OrgUnit o : orphans) {
            o.setParentId(root.getId());
            o.setLevel(2);
            repo.save(o);
            log.info("OrgUnitDataFixer: fixed {} → parent {}", o.getName(), root.getName());
        }

        log.info("OrgUnitDataFixer: fixed {} orphan(s)", orphans.size());
    }
}
