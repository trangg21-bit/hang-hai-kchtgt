package com.hanghai.kchtg.tai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service stub cho tiep tuc M-007 PointObject sync integration cua module M-015.
 * Khi approve, upsert vao phao map.
 * Khi xoa mem, gianh phao.
 */
@Service
@Slf4j
public class PointObjectSyncService {

    public void syncToMapPhao(UUID id) {
        log.info("syncToMapPhao: {}", id);
    }

    public void hideFromMapPhao(UUID id) {
        log.info("hideFromMapPhao: {}", id);
    }
}
