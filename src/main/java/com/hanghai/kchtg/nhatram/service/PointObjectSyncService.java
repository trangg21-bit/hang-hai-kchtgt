package com.hanghai.kchtg.nhatram.service;

import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import org.springframework.stereotype.Service;

/**
 * Service stub cho tiep tuc M-007 PointObject sync integration.
 * Khi approveL2, upsert vao point_objects table.
 * Khi xoa mem, gianh diem (KHONG XOA theo BR-070-05).
 */
@Service
public class PointObjectSyncService {

    /**
     * Sync NhaTramDen (den) toi M-007 point_objects khi duoc cong bo.
     */
    public void syncToMapDen(NhaTramDen entity) {
        // Post-M-007 integration: upsert vao point_objects.
        // code = entity.getCode()
        // name = entity.getName()
        // objectType = LIGHTHOUSE / BEACON / BEACON_LIGHT
        // latitude, longitude, status = PUBLISHED, unitId tu entity
    }

    /**
     * Gianh NhaTramDen diem khoi M-007 map khi xoa mem.
     * KHONG xoa diem (theo BR-070-05).
     */
    public void hideFromMapDen(NhaTramDen entity) {
        // Post-M-007 integration: set status = DELETED trong point_objects.
        // BR-070-05: KHONG tu dong xoa diem trong M-007
    }

    /**
     * Sync NhaTramPhao (phao) toi M-007 point_objects khi duoc cong bo.
     */
    public void syncToMapPhao(NhaTramPhao entity) {
        // Post-M-007 integration: upsert vao point_objects.
        // code = entity.getCode()
        // name = entity.getName()
        // objectType = BUOY
        // latitude, longitude, status = PUBLISHED, unitId tu entity
    }

    /**
     * Gianh NhaTramPhao diem khoi M-007 map khi xoa mem.
     * KHONG xoa diem (theo BR-070-05).
     */
    public void hideFromMapPhao(NhaTramPhao entity) {
        // Post-M-007 integration: set status = DELETED trong point_objects.
        // BR-070-05: KHONG tu dong xoa diem trong M-007
    }
}
