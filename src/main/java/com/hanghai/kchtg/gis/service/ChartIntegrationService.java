package com.hanghai.kchtg.gis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.gis.entity.ChartCell;
import com.hanghai.kchtg.gis.entity.ChartFeature;
import com.hanghai.kchtg.gis.entity.S63Permit;
import com.hanghai.kchtg.gis.layer.entity.MapLayer;
import com.hanghai.kchtg.gis.layer.repository.MapLayerRepository;
import com.hanghai.kchtg.gis.parser.S57Parser;
import com.hanghai.kchtg.gis.parser.S63Decryptor;
import com.hanghai.kchtg.gis.repository.ChartCellRepository;
import com.hanghai.kchtg.gis.repository.ChartFeatureRepository;
import com.hanghai.kchtg.gis.repository.S63PermitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChartIntegrationService {

    private final ChartCellRepository cellRepository;
    private final ChartFeatureRepository featureRepository;
    private final S63PermitRepository permitRepository;
    private final MapLayerRepository mapLayerRepository;
    private final S57Parser s57Parser;
    private final S63Decryptor s63Decryptor;
    private final S52StyleService s52StyleService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Imports a standard S-57 chart cell (.000).
     */
    @Transactional
    public ChartCell importS57(byte[] fileBytes, String filename) throws IOException {
        S57Parser.ParsedCellData parsedData = s57Parser.parse(fileBytes, filename);

        // Save cell metadata
        ChartCell cell = cellRepository.findByCellName(parsedData.cellName)
                .orElse(new ChartCell());
        cell.setCellName(parsedData.cellName);
        cell.setProducer(parsedData.producer);
        cell.setEdition(parsedData.edition);
        cell.setScale(parsedData.scale);
        cell.setUpdateNumber(parsedData.updateNumber);
        cell.setReleaseDate(parsedData.releaseDate);
        cell.setIsEncrypted(false);
        cell.setStatus(ChartCell.Status.ACTIVE);

        // Resolve and save coordinates
        double[] coords = calculateCenterCoordinate(parsedData.cellName);
        cell.setLatitude(coords[0]);
        cell.setLongitude(coords[1]);

        ChartCell savedCell = cellRepository.save(cell);

        // Delete old features if updating existing cell
        List<ChartFeature> oldFeatures = featureRepository.findByCellId(savedCell.getId());
        if (!oldFeatures.isEmpty()) {
            featureRepository.deleteAll(oldFeatures);
        }

        // Save features
        for (ChartFeature feature : parsedData.features) {
            feature.setCellId(savedCell.getId());
            featureRepository.save(feature);
        }

        // Automatically create or update a corresponding MapLayer entry
        syncToMapLayers(savedCell);

        return savedCell;
    }

    /**
     * Imports an encrypted S-63 secured chart cell (.000).
     * Decrypts using Blowfish key matching the registered Cell Permit.
     */
    @Transactional
    public ChartCell importS63(byte[] fileBytes, String filename) throws IOException {
        String cellName = filename.replace(".000", "").toUpperCase();

        S63Permit permit = permitRepository.findByCellName(cellName)
                .orElseThrow(() -> new IOException("Không tìm thấy giấy phép Cell Permit S-63 cho Cell: " + cellName + ". Vui lòng đăng ký permit trước."));

        byte[] decryptedBytes = s63Decryptor.decrypt(fileBytes, permit);

        S57Parser.ParsedCellData parsedData = s57Parser.parse(decryptedBytes, filename);

        // Save cell metadata
        ChartCell cell = cellRepository.findByCellName(parsedData.cellName)
                .orElse(new ChartCell());
        cell.setCellName(parsedData.cellName);
        cell.setProducer(parsedData.producer);
        cell.setEdition(parsedData.edition);
        cell.setScale(parsedData.scale);
        cell.setUpdateNumber(parsedData.updateNumber);
        cell.setReleaseDate(parsedData.releaseDate);
        cell.setIsEncrypted(true);
        cell.setStatus(ChartCell.Status.ACTIVE);

        // Resolve and save coordinates
        double[] coords = calculateCenterCoordinate(parsedData.cellName);
        cell.setLatitude(coords[0]);
        cell.setLongitude(coords[1]);

        ChartCell savedCell = cellRepository.save(cell);

        // Delete old features if updating
        List<ChartFeature> oldFeatures = featureRepository.findByCellId(savedCell.getId());
        if (!oldFeatures.isEmpty()) {
            featureRepository.deleteAll(oldFeatures);
        }

        // Save features
        for (ChartFeature feature : parsedData.features) {
            feature.setCellId(savedCell.getId());
            featureRepository.save(feature);
        }

        syncToMapLayers(savedCell);

        return savedCell;
    }

    /**
     * Registers an S-63 Cell Permit.
     */
    @Transactional
    public S63Permit registerPermit(String cellName, String permitKey, String expiryDateStr) {
        String cleanCellName = cellName.toUpperCase().trim();
        S63Permit permit = permitRepository.findByCellName(cleanCellName)
                .orElse(new S63Permit());
        permit.setCellName(cleanCellName);
        permit.setPermitKey(permitKey.trim());
        permit.setExpiryDate(java.time.LocalDate.parse(expiryDateStr.trim()));
        permit.setActive(true);

        return permitRepository.save(permit);
    }

    public boolean isPermitRegistered(String cellName) {
        if (cellName == null) return false;
        return permitRepository.findByCellName(cellName.toUpperCase().trim()).isPresent();
    }

    /**
     * Lists all registered permits.
     */
    public List<S63Permit> getAllPermits() {
        return permitRepository.findAll();
    }

    /**
     * Deletes a permit by ID.
     */
    @Transactional
    public void deletePermit(UUID id) {
        permitRepository.deleteById(id);
    }

    /**
     * Lists all imported chart cells.
     */
    public List<ChartCell> getAllCells() {
        return cellRepository.findAll();
    }

    /**
     * Lists features in a cell.
     */
    public List<ChartFeature> getFeatures(UUID cellId) {
        return featureRepository.findByCellId(cellId);
    }

    /**
     * Gets features for a cell fully styled with S-52 guidelines.
     */
    public List<Map<String, Object>> getS52StyledFeatures(UUID cellId, String palette) {
        List<ChartFeature> features = featureRepository.findByCellId(cellId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (ChartFeature f : features) {
            S52StyleService.S52Style style = s52StyleService.getStyle(f, palette);
            Map<String, Object> featureMap = new HashMap<>();
            featureMap.put("id", f.getId());
            featureMap.put("featureName", f.getFeatureName());
            featureMap.put("featureCode", f.getFeatureCode());
            featureMap.put("geometryType", f.getGeometryType().name());
            featureMap.put("coordinates", f.getCoordinates());

            try {
                featureMap.put("attributes", objectMapper.readValue(f.getAttributesJson(), Map.class));
            } catch (Exception e) {
                featureMap.put("attributes", new HashMap<>());
            }

            Map<String, Object> styleMap = new HashMap<>();
            styleMap.put("fillColor", style.fillColor);
            styleMap.put("strokeColor", style.strokeColor);
            styleMap.put("strokeWidth", style.strokeWidth);
            styleMap.put("strokeDashArray", style.strokeDashArray);
            styleMap.put("iconSymbol", style.iconSymbol);
            styleMap.put("fillOpacity", style.fillOpacity);

            featureMap.put("s52Style", styleMap);
            result.add(featureMap);
        }

        return result;
    }

    private void syncToMapLayers(ChartCell cell) {
        String code = "CHART-" + cell.getCellName();
        MapLayer layer = mapLayerRepository.findByCode(code)
                .orElse(new MapLayer());
        layer.setName("Hải đồ " + cell.getCellName() + (cell.getIsEncrypted() ? " (S-63)" : " (S-57)"));
        layer.setCode(code);
        layer.setLayerType(MapLayer.LayerType.OVERLAY);
        layer.setSource("/api/gis/charts/cells/" + cell.getId() + "/s52-styled");
        layer.setVisible(true);
        layer.setOpacity(0.8);
        layer.setOrder(100); // Higher order so overlays load on top of point/line maps
        layer.setStatus(MapLayer.Status.ACTIVE);

        mapLayerRepository.save(layer);
    }

    private static final Map<String, double[]> CELL_COORDINATES = new HashMap<>();
    static {
        CELL_COORDINATES.put("HP", new double[]{20.80, 106.70});     // Hải Phòng
        CELL_COORDINATES.put("HG", new double[]{20.95, 107.15});     // Hạ Long
        CELL_COORDINATES.put("HL", new double[]{17.90, 106.40});     // Hòn La
        CELL_COORDINATES.put("HTH", new double[]{10.00, 104.00});    // Hòn Thơm
        CELL_COORDINATES.put("DNA", new double[]{16.10, 108.20});    // Đà Nẵng
        CELL_COORDINATES.put("DQ", new double[]{15.40, 108.80});     // Dung Quất
        CELL_COORDINATES.put("KHA", new double[]{12.20, 109.20});    // Khánh Hòa
        CELL_COORDINATES.put("CLO", new double[]{18.80, 105.70});    // Cửa Lò
        CELL_COORDINATES.put("CM", new double[]{9.20, 104.90});      // Cà Mau
        CELL_COORDINATES.put("CVI", new double[]{16.90, 107.20});    // Cửa Việt
        CELL_COORDINATES.put("CGI", new double[]{17.70, 106.50});    // Cửa Gianh
        CELL_COORDINATES.put("CHO", new double[]{18.70, 105.80});    // Cửa Hội
        CELL_COORDINATES.put("DDI", new double[]{20.50, 106.60});    // Diêm Điền
        CELL_COORDINATES.put("LM", new double[]{16.10, 108.15});     // Liên Chiểu
        CELL_COORDINATES.put("NGS", new double[]{19.30, 105.80});    // Nghi Sơn
        CELL_COORDINATES.put("SKY", new double[]{21.00, 106.40});    // Sông Kinh Thầy
        CELL_COORDINATES.put("THA", new double[]{16.55, 107.65});    // Thuận An
        CELL_COORDINATES.put("VA", new double[]{18.10, 106.30});     // Vũng Áng
        CELL_COORDINATES.put("VG", new double[]{10.40, 107.10});     // Vũng Tàu / Gành Rái
        CELL_COORDINATES.put("V24CD", new double[]{8.70, 106.60});   // Côn Đảo
        CELL_COORDINATES.put("V24DM", new double[]{20.50, 106.60});  // Diêm Điền
        CELL_COORDINATES.put("V24DN", new double[]{16.10, 108.20});  // Đà Nẵng
        CELL_COORDINATES.put("V24GG", new double[]{9.20, 105.40});   // Gành Hào
        CELL_COORDINATES.put("V24HT", new double[]{10.40, 104.50});  // Hà Tiên
        CELL_COORDINATES.put("V24NC", new double[]{19.30, 105.80});  // Nghi Sơn
        CELL_COORDINATES.put("V24NT", new double[]{12.20, 109.20});  // Nha Trang
        CELL_COORDINATES.put("V24QN", new double[]{13.70, 109.25});  // Quy Nhơn
        CELL_COORDINATES.put("V24SD", new double[]{9.00, 104.80});   // Sông Đốc
        CELL_COORDINATES.put("V24SG", new double[]{10.70, 106.70});  // Sài Gòn
        CELL_COORDINATES.put("V24SH", new double[]{9.50, 106.30});   // Sông Hậu
        CELL_COORDINATES.put("V24SR", new double[]{20.90, 106.80});  // Sông Rút
        CELL_COORDINATES.put("V24ST", new double[]{9.60, 106.00});   // Sóc Trăng
        CELL_COORDINATES.put("V24TV", new double[]{9.70, 106.30});   // Trà Vinh
        CELL_COORDINATES.put("V24VR", new double[]{12.90, 109.40});  // Vũng Rô
    }

    private double[] calculateCenterCoordinate(String cellName) {
        if (cellName == null || cellName.trim().isEmpty()) {
            return new double[]{16.0, 108.0}; // Fallback: Vietnam center
        }
        String cleanName = cellName.toUpperCase().trim();

        // Direct exact match
        if (CELL_COORDINATES.containsKey(cleanName)) {
            return CELL_COORDINATES.get(cleanName);
        }

        // Prefix match (longest prefix first)
        List<String> keys = new ArrayList<>(CELL_COORDINATES.keySet());
        keys.sort((a, b) -> b.length() - a.length());
        for (String prefix : keys) {
            if (cleanName.startsWith(prefix) || cleanName.contains(prefix)) {
                double[] baseCenter = CELL_COORDINATES.get(prefix);

                // Add the trailing digit offset exactly like the frontend
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+$");
                java.util.regex.Matcher matcher = pattern.matcher(cleanName);
                if (matcher.find()) {
                    try {
                        int num = Integer.parseInt(matcher.group());
                        double latOffset = ((num % 3) - 1) * 0.05;
                        double lonOffset = ((num / 3) - 1) * 0.05;
                        return new double[]{baseCenter[0] + latOffset, baseCenter[1] + lonOffset};
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
                return baseCenter.clone();
            }
        }

        // Fallback hash logic
        int hash = 0;
        for (int i = 0; i < cleanName.length(); i++) {
            hash = cleanName.charAt(i) + ((hash << 5) - hash);
        }
        double lat = 10.0 + (Math.abs(hash) % 100) * 0.1;
        double lon = 105.0 + (Math.abs(hash >> 8) % 40) * 0.1;
        return new double[]{lat, lon};
    }
}
