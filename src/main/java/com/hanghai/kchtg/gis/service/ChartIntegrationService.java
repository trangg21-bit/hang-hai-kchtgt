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
import java.time.LocalDateTime;
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
}
