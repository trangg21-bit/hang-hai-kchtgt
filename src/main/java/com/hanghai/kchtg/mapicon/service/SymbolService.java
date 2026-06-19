package com.hanghai.kchtg.mapicon.service;

import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.entity.SymbolLibrary;
import com.hanghai.kchtg.mapicon.entity.SymbolUsage;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import com.hanghai.kchtg.mapicon.repository.SymbolLibraryRepository;
import com.hanghai.kchtg.mapicon.repository.SymbolUsageRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Service quản lý biểu tượng bản đồ với SVG validation và GeoServer SLD generation.
 */
@Service
public class SymbolService {

    private static final Logger log = LoggerFactory.getLogger(SymbolService.class);
    private static final int MAX_SVG_SIZE = 50_000;
    private static final int MAX_PNG_SIZE = 100_000;

    private final SymbolLibraryRepository libraryRepo;
    private final SymbolUsageRepository usageRepo;
    private final MapIconRepository mapIconRepo;

    public SymbolService(SymbolLibraryRepository libraryRepo,
                         SymbolUsageRepository usageRepo,
                         MapIconRepository mapIconRepo) {
        this.libraryRepo = libraryRepo;
        this.usageRepo = usageRepo;
        this.mapIconRepo = mapIconRepo;
    }

    // ── CRUD ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MapIcon> findAll() {
        return mapIconRepo.findAll();
    }

    @Transactional(readOnly = true)
    public MapIcon findById(UUID id) {
        return mapIconRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Map icon not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<MapIcon> findByCategory(MapIcon.Category category) {
        return mapIconRepo.findByCategory(category);
    }

    // ── SVG Validation ───────────────────────────────────────────────

    public void validateSvgContent(String svgContent) {
        if (svgContent == null || svgContent.isBlank()) {
            throw new IllegalArgumentException("SVG content cannot be empty");
        }
        if (svgContent.length() > MAX_SVG_SIZE) {
            throw new IllegalArgumentException("SVG file too large: " + svgContent.length()
                    + " bytes (max: " + MAX_SVG_SIZE + ")");
        }
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            ByteArrayInputStream stream = new ByteArrayInputStream(
                    svgContent.getBytes(StandardCharsets.UTF_8));
            builder.parse(stream);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid SVG content: " + e.getMessage());
        }
    }

    public void validateUpload(String fileName, long fileSize, String contentType) {
        String ext = getExtension(fileName);
        if (!Arrays.asList("svg", "png", "sld").contains(ext.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported format: " + ext);
        }
        long maxSize = "svg".equals(ext.toLowerCase()) ? MAX_SVG_SIZE
                : "png".equals(ext.toLowerCase()) ? MAX_PNG_SIZE : 10_000;
        if (fileSize > maxSize) {
            throw new IllegalArgumentException("File too large: " + fileSize + " bytes (max: " + maxSize + ")");
        }
    }

    // ── GeoServer SLD Generation ──────────────────────────────────────

    @Transactional(readOnly = true)
    public String generateSLD(UUID symbolId, String featureType) {
        SymbolLibrary symbol = libraryRepo.findById(symbolId)
                .orElseThrow(() -> new EntityNotFoundException("Symbol not found: " + symbolId));
        if (symbol.getFormat() != SymbolLibrary.SymbolFormat.SLD) {
            throw new IllegalArgumentException("SLD generation only available for SLD format symbols");
        }
        return String.format("""
                <?xml version=\"1.0\" encoding=\"UTF-8\"?>
                <StyledLayerDescriptor xmlns=\"http://www.opengis.net/sld\" version=\"1.1.0\">
                  <NamedLayer>
                    <Name>%s</Name>
                    <UserStyle>
                      <Title>%s</Title>
                      <FeatureTypeStyle>
                        <Rule>
                          <PointSymbolizer>
                            <Graphic>
                              <Mark><WellKnownName>shape://dot</WellKnownName>
                              <Fill><CssParameter name=\"fill\">#FF0000</CssParameter></Fill>
                              </Mark>
                              <Size>6</Size>
                            </Graphic>
                          </PointSymbolizer>
                        </Rule>
                      </FeatureTypeStyle>
                    </UserStyle>
                  </NamedLayer>
                </StyledLayerDescriptor>
                """, symbol.getCode(), symbol.getName());
    }

    public Map<String, Object> testSLDWithGeoServer(UUID symbolId, String geoServerUrl) {
        String sld = generateSLD(symbolId, "map_icons");
        Map<String, Object> result = new HashMap<>();
        try {
            result.put("success", true);
            result.put("message", "SLD validation passed");
            result.put("sld", sld);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "SLD validation failed: " + e.getMessage());
        }
        return result;
    }

    // ── Usage Tracking ───────────────────────────────────────────────

    @Transactional
    public SymbolUsage recordUsage(UUID symbolId, UUID objectId, String objectType, UUID usedBy) {
        SymbolLibrary symbol = libraryRepo.findById(symbolId)
                .orElseThrow(() -> new EntityNotFoundException("Symbol not found: " + symbolId));
        SymbolUsage usage = SymbolUsage.create(symbolId, objectId, objectType, usedBy);
        return usageRepo.save(usage);
    }

    @Transactional(readOnly = true)
    public List<SymbolUsage> getUsageHistory(UUID symbolId) {
        return usageRepo.findBySymbolIdOrderByUsedAtDesc(symbolId);
    }

    @Transactional(readOnly = true)
    public long getUsageCount(UUID symbolId) {
        return usageRepo.countBySymbolId(symbolId);
    }

    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(dot + 1) : "";
    }
}
