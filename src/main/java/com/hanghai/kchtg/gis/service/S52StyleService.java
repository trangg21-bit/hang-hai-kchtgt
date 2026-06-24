package com.hanghai.kchtg.gis.service;

import com.hanghai.kchtg.gis.entity.ChartFeature;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class S52StyleService {

    public static class S52Style {
        public String fillColor;
        public String strokeColor;
        public int strokeWidth;
        public String strokeDashArray;
        public String iconSymbol;
        public double fillOpacity;
    }

    /**
     * Maps an S-57 feature and attributes to S-52 standard display presentation rules
     * according to the specified color palette (DAY, DUSK, NIGHT).
     */
    public S52Style getStyle(ChartFeature feature, String palette) {
        S52Style style = new S52Style();
        
        // Defaults
        style.fillColor = "#808080";
        style.strokeColor = "#000000";
        style.strokeWidth = 2;
        style.strokeDashArray = "";
        style.iconSymbol = "default-marker";
        style.fillOpacity = 0.5;

        boolean isDay = !"DUSK".equalsIgnoreCase(palette) && !"NIGHT".equalsIgnoreCase(palette);
        boolean isDusk = "DUSK".equalsIgnoreCase(palette);
        boolean isNight = "NIGHT".equalsIgnoreCase(palette);

        String code = feature.getFeatureCode().toUpperCase();

        switch (code) {
            case "BOYSPP": // Buoy Special Purpose
                style.iconSymbol = "special-buoy";
                style.strokeColor = isDay ? "#ffff00" : (isDusk ? "#cccc00" : "#888800"); // Yellow buoy
                style.fillColor = style.strokeColor;
                style.fillOpacity = 0.8;
                break;

            case "LIGHTS": // Lighthouse or Light beacon
                style.iconSymbol = "lighthouse-beacon";
                style.strokeColor = isDay ? "#ff00ff" : (isDusk ? "#cc00cc" : "#880088"); // Magenta light flare
                style.fillColor = style.strokeColor;
                style.fillOpacity = 0.6;
                break;

            case "DEPCNT": // Depth Contour
                style.iconSymbol = "none";
                style.strokeColor = isDay ? "#0000ff" : (isDusk ? "#0000aa" : "#000055"); // Blue lines
                style.strokeWidth = 1;
                style.fillColor = "none";
                style.fillOpacity = 0;
                break;

            case "ACHARE": // Anchorage Area
                style.iconSymbol = "anchorage-area";
                style.strokeColor = isDay ? "#00ff00" : (isDusk ? "#00aa00" : "#005500"); // Green dashed boundary
                style.strokeWidth = 2;
                style.strokeDashArray = "5,5";
                style.fillColor = isDay ? "#e6ffe6" : (isDusk ? "#b3e6b3" : "#1a331a");
                style.fillOpacity = 0.3;
                break;

            case "LNDARE": // Land Area
                style.iconSymbol = "none";
                style.strokeColor = isDay ? "#996633" : (isDusk ? "#734d26" : "#4d331a"); // Brown land fill
                style.fillColor = isDay ? "#f5f5dc" : (isDusk ? "#d2b48c" : "#2f4f4f");
                style.fillOpacity = 0.7;
                style.strokeWidth = 1;
                break;

            case "RESARE": // Restricted Area
                style.iconSymbol = "restricted-area";
                style.strokeColor = isDay ? "#ff0000" : (isDusk ? "#cc0000" : "#880000"); // Red dashed boundary
                style.strokeWidth = 2;
                style.strokeDashArray = "4,4";
                style.fillColor = isDay ? "#ffe6e6" : (isDusk ? "#e6b3b3" : "#331a1a");
                style.fillOpacity = 0.4;
                break;

            default:
                // Default shapes
                if (feature.getGeometryType() == ChartFeature.GeometryType.POINT) {
                    style.iconSymbol = "dot-marker";
                    style.strokeColor = "#000000";
                    style.fillColor = "#ffffff";
                } else if (feature.getGeometryType() == ChartFeature.GeometryType.LINE) {
                    style.iconSymbol = "none";
                    style.strokeColor = isDay ? "#555555" : "#aaaaaa";
                    style.strokeWidth = 2;
                } else {
                    style.iconSymbol = "none";
                    style.strokeColor = isDay ? "#666666" : "#999999";
                    style.fillColor = isDay ? "#cccccc" : "#333333";
                    style.fillOpacity = 0.4;
                }
                break;
        }

        // Palette-specific overall filters
        if (isNight) {
            // In NIGHT mode, everything gets a red/dark tint to preserve night-vision
            style.fillColor = applyNightFilter(style.fillColor);
            style.strokeColor = applyNightFilter(style.strokeColor);
        }

        return style;
    }

    private String applyNightFilter(String hexColor) {
        if ("none".equals(hexColor) || hexColor == null) return hexColor;
        // Night mode reduces green/blue and shifts to dark/red shades
        if (hexColor.startsWith("#")) {
            try {
                String hex = hexColor.substring(1);
                int r = Integer.parseInt(hex.substring(0, 2), 16);
                int g = hex.length() > 4 ? Integer.parseInt(hex.substring(2, 4), 16) : 0;
                int b = hex.length() > 4 ? Integer.parseInt(hex.substring(4, 6), 16) : 0;

                // Scale down significantly and shift to red
                r = Math.max(30, r / 3);
                g = g / 8;
                b = b / 8;

                return String.format("#%02x%02x%02x", r, g, b);
            } catch (Exception e) {
                return "#220000";
            }
        }
        return hexColor;
    }
}
