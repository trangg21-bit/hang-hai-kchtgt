package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSHistoryResponse;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Shared history tracking service.
 * Uses an in-memory list for Wave 1; Wave 3 will persist to a proper table.
 */
@Service
public class HistoryService {

    private final List<CoastalStationVTSHistoryResponse> historyStore = new ArrayList<>();

    public void recordHistory(String stationCode, StationHistoryActionType action,
                              String previousValue, String newValue,
                              String changedBy, LocalDateTime changedAt) {
        CoastalStationVTSHistoryResponse entry = new CoastalStationVTSHistoryResponse();
        entry.setId(UUID.randomUUID());
        entry.setStationCode(stationCode);
        entry.setActionType(action);
        entry.setPreviousValue(previousValue);
        entry.setNewValue(newValue);
        entry.setChangedBy(changedBy);
        entry.setChangedAt(changedAt);
        historyStore.add(entry);
    }

    public List<CoastalStationVTSHistoryResponse> getHistory(String stationCode) {
        return historyStore.stream()
                .filter(h -> h.getStationCode().equals(stationCode))
                .toList();
    }

    public void clearHistory() {
        historyStore.clear();
    }
}
