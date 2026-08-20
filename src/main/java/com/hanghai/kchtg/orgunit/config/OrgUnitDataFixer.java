package com.hanghai.kchtg.orgunit.config;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup runner: seeds demo org hierarchy if DB is empty, then fixes missing parent_id.
 */
@Component
@Order(1)
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

            if (count == 0) {
                seedDemoData();
                count = repo.count();
                log.info("OrgUnitDataFixer: seeded {} demo org units", count);
            }

            fixOrphans();

        } catch (Exception e) {
            log.error("OrgUnitDataFixer: failed", e);
        }
    }

    private void seedDemoData() {
        OrgUnit root = OrgUnit.builder()
                .name("Cục Hàng hải và Đường thủy Việt Nam")
                .description("Đơn vị gốc - Cục Hàng hải và Đường thủy Việt Nam")
                .parentId(null)
                .level(1)
                .rank(rankForLevel(1))
                .path("")
                .sortOrder(0)
                .build();
        root = repo.save(root);

        OrgUnit cvHp = child(root, "Cảng vụ Hàng hải Hải Phòng", 1);
        OrgUnit cvQn = child(root, "Cảng vụ Hàng hải Quảng Ninh", 2);
        child(root, "Cảng vụ Hàng hải TP. Hồ Chí Minh", 3);

        child(cvHp, "Đại diện Cảng vụ Hải Phòng tại Đình Vũ", 1);
        child(cvHp, "Đại diện Cảng vụ Hải Phòng tại Bạch Đằng", 2);
        child(cvQn, "Đại diện Cảng vụ Quảng Ninh tại Móng Cái", 1);
        child(cvQn, "Đại diện Cảng vụ Quảng Ninh tại Vân Đồn", 2);

        log.info("OrgUnitDataFixer: seeded Cục HHVT + 3 Cảng vụ + 4 Đại diện");
    }

    private OrgUnit child(OrgUnit parent, String name, int sort) {
        OrgUnit child = OrgUnit.builder()
                .name(name)
                .description(name)
                .parentId(parent.getId())
                .level(parent.getLevel() + 1)
                .rank(rankForLevel(parent.getLevel() + 1))
                .path(parent.getPath() + parent.getId() + "/")
                .sortOrder(sort)
                .build();
        return repo.save(child);
    }

    private static OrgUnitRank rankForLevel(Integer level) {
        if (level == null || level <= 1) return OrgUnitRank.DEPARTMENT;
        if (level == 2) return OrgUnitRank.BRANCH;
        return OrgUnitRank.REPRESENTATIVE;
    }

    private void fixOrphans() {
        List<OrgUnit> roots = repo.findByParentIdIsNull();
        if (roots.isEmpty()) {
            log.info("OrgUnitDataFixer: no root CUC — skipping orphan fix");
            return;
        }

        OrgUnit root = roots.get(0);

        List<OrgUnit> orphans = repo.findByParentIdIsNull().stream()
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
