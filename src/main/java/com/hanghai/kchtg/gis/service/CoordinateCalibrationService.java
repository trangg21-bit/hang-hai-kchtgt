package com.hanghai.kchtg.gis.service;

import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CoordinateCalibrationService {

    public static class CoordinateResult {
        public double longitude;
        public double latitude;
        public boolean valid;
        public String errorMessage;
    }

    /**
     * Calibrates and converts coordinate inputs from various systems to WGS84 (EPSG:4326).
     *
     * @param systemType "WGS84", "VN2000", "UTM"
     * @param coord1     For WGS84: longitude (or DMS string). For VN2000/UTM: Easting (X).
     * @param coord2     For WGS84: latitude (or DMS string). For VN2000/UTM: Northing (Y).
     * @param zoneOrCm   Central Meridian for VN-2000 (e.g. "105.0", "108.0") or UTM Zone (e.g. "48N", "49N")
     * @param dx         Calibration shift X/Longitude offset (in meters for VN2000/UTM, or degrees for WGS84)
     * @param dy         Calibration shift Y/Latitude offset (in meters for VN2000/UTM, or degrees for WGS84)
     */
    public CoordinateResult calibrate(String systemType, String coord1, String coord2, String zoneOrCm, double dx, double dy) {
        CoordinateResult result = new CoordinateResult();
        result.valid = true;

        try {
            if ("WGS84".equalsIgnoreCase(systemType)) {
                double lon = parseCoordinateString(coord1);
                double lat = parseCoordinateString(coord2);

                // Apply degree-based calibration shifts
                lon += dx;
                lat += dy;

                result.longitude = lon;
                result.latitude = lat;

            } else if ("VN2000".equalsIgnoreCase(systemType)) {
                double easting = Double.parseDouble(coord1.trim());
                double northing = Double.parseDouble(coord2.trim());

                // Apply meter-based calibration shifts before transformation
                easting += dx;
                northing += dy;

                double cm = 105.0; // Default central meridian
                if (zoneOrCm != null && !zoneOrCm.trim().isEmpty()) {
                    cm = Double.parseDouble(zoneOrCm.trim());
                }

                double[] latLon = convertVN2000ToWGS84(easting, northing, cm);
                result.latitude = latLon[0];
                result.longitude = latLon[1];

            } else if ("UTM".equalsIgnoreCase(systemType)) {
                double easting = Double.parseDouble(coord1.trim());
                double northing = Double.parseDouble(coord2.trim());

                easting += dx;
                northing += dy;

                int zone = 48; // Default zone 48
                boolean northernHemisphere = true;

                if (zoneOrCm != null && !zoneOrCm.trim().isEmpty()) {
                    String z = zoneOrCm.trim().toUpperCase();
                    if (z.endsWith("N")) {
                        zone = Integer.parseInt(z.substring(0, z.length() - 1));
                    } else if (z.endsWith("S")) {
                        zone = Integer.parseInt(z.substring(0, z.length() - 1));
                        northernHemisphere = false;
                    } else {
                        zone = Integer.parseInt(z);
                    }
                }

                double[] latLon = convertUTMToWGS84(easting, northing, zone, northernHemisphere);
                result.latitude = latLon[0];
                result.longitude = latLon[1];

            } else {
                result.valid = false;
                result.errorMessage = "Hệ tọa độ không hỗ trợ: " + systemType;
                return result;
            }

            // Validate coordinate ranges
            if (result.longitude < -180.0 || result.longitude > 180.0) {
                result.valid = false;
                result.errorMessage = "Kinh độ vượt quá phạm vi hợp lệ [-180, 180]: " + result.longitude;
            }
            if (result.latitude < -90.0 || result.latitude > 90.0) {
                result.valid = false;
                result.errorMessage = "Vĩ độ vượt quá phạm vi hợp lệ [-90, 90]: " + result.latitude;
            }

        } catch (Exception e) {
            result.valid = false;
            result.errorMessage = "Lỗi tính toán hiệu tọa độ: " + e.getMessage();
        }

        return result;
    }

    /**
     * Parses degrees minutes seconds (DMS) or degrees decimal minutes (DDM) or decimal degrees string.
     * E.g. "10°24'36.5\" N", "10 24.608 N", "-105.42"
     */
    public double parseCoordinateString(String coordStr) {
        if (coordStr == null || coordStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Tọa độ rỗng");
        }

        String cleaned = coordStr.trim().replace(",", ".");

        // 1. Determine sign from direction letter first (only at the start or end)
        double sign = 1.0;
        Pattern dirPattern = Pattern.compile("(^[NSEWnsew]|[NSEWnsew]$)");
        Matcher dirMatcher = dirPattern.matcher(cleaned);
        if (dirMatcher.find()) {
            String dir = dirMatcher.group(1).toUpperCase();
            if ("S".equals(dir) || "W".equals(dir)) {
                sign = -1.0;
            }
            // Remove the direction letter from cleaned string
            cleaned = cleaned.replace(dirMatcher.group(1), "");
        }

        cleaned = cleaned.trim();

        // 2. Check if it is a simple decimal degrees number
        if (cleaned.matches("^-?\\d+(?:\\.\\d+)?$")) {
            return sign * Double.parseDouble(cleaned);
        }

        // 3. Otherwise, parse as DMS/DDM (using space/symbols as delimiters)
        Pattern dmsPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)[°\\sDd\\s]+(\\d+(?:\\.\\d+)?)[\\'\\sMm\\s]*(?:(\\d+(?:\\.\\d+)?)[\\\"\\sSs\\s]*)?");
        Matcher dmsMatcher = dmsPattern.matcher(cleaned);
        if (dmsMatcher.find()) {
            double deg = Double.parseDouble(dmsMatcher.group(1));
            double min = Double.parseDouble(dmsMatcher.group(2));
            double sec = 0.0;
            if (dmsMatcher.group(3) != null) {
                sec = Double.parseDouble(dmsMatcher.group(3));
            }
            return sign * (deg + (min / 60.0) + (sec / 3600.0));
        }

        // 4. Fallback to direct float parsing after stripping non-numeric chars
        String finalClean = cleaned.replaceAll("[^\\d\\.-]", "");
        return sign * Double.parseDouble(finalClean);
    }

    /**
     * Inverse Transverse Mercator projection for VN-2000 to WGS84.
     * VN-2000 uses Krassovsky 1940 ellipsoid (a = 6378245, f = 1/298.3) historically,
     * but standard mapping uses WGS-84 parameters (a = 6378137.0, f = 1/298.257223563) with a local datum.
     * Scale factor is k0 = 0.9999 for 3-degree zone, false Easting is 500,000, false Northing is 0.
     */
    private double[] convertVN2000ToWGS84(double easting, double northing, double centralMeridian) {
        // Transverse Mercator (TM) Inverse projection parameters
        double a = 6378137.0; // semi-major axis
        double f = 1.0 / 298.257223563; // flattening
        double k0 = 0.9999; // scale factor for 3-degree zone (commonly used for local VN2000)
        double falseEasting = 500000.0;

        double e2 = 2 * f - f * f;
        double e4 = e2 * e2;
        double e6 = e4 * e2;
        double e_prime2 = e2 / (1 - e2);

        double M = northing / k0;
        double mu = M / (a * (1 - e2 / 4.0 - 3 * e4 / 64.0 - 5 * e6 / 256.0));

        double e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
        double e1_2 = e1 * e1;
        double e1_3 = e1_2 * e1;
        double e1_4 = e1_3 * e1;

        double J1 = (3 * e1 / 2 - 27 * e1_3 / 32) * Math.sin(2 * mu);
        double J2 = (21 * e1_2 / 16 - 55 * e1_4 / 32) * Math.sin(4 * mu);
        double J3 = (151 * e1_3 / 96) * Math.sin(6 * mu);
        double J4 = (1097 * e1_4 / 512) * Math.sin(8 * mu);

        double fp = mu + J1 + J2 + J3 + J4; // footprint latitude

        double e_cosfp = e_prime2 * Math.cos(fp) * Math.cos(fp);
        double N1 = a / Math.sqrt(1 - e2 * Math.sin(fp) * Math.sin(fp));
        double R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(fp) * Math.sin(fp), 1.5);
        double D = (easting - falseEasting) / (N1 * k0);

        double D2 = D * D;
        double D4 = D2 * D2;
        double D6 = D4 * D2;

        double tanfp = Math.tan(fp);
        double tanfp2 = tanfp * tanfp;
        double tanfp4 = tanfp2 * tanfp2;

        double fact1 = N1 * tanfp / R1;
        double term1 = D2 / 2.0;
        double term2 = (5 + 3 * tanfp2 + 10 * e_cosfp - 4 * e_cosfp * e_cosfp - 9 * e_prime2) * D4 / 24.0;
        double term3 = (61 + 90 * tanfp2 + 45 * tanfp4 + 350 * e_cosfp - 252 * e_prime2) * D6 / 720.0;
        double lat = fp - fact1 * (term1 - term2 + term3);

        double fact2 = 1.0 / Math.cos(fp);
        double term4 = D;
        double term5 = (1 + 2 * tanfp2 + e_cosfp) * D2 * D / 6.0;
        double term6 = (5 + 28 * tanfp2 + 24 * tanfp4 + 6 * e_cosfp + 8 * e_cosfp * e_cosfp) * D4 * D / 120.0;
        double lon = (centralMeridian * Math.PI / 180.0) + fact2 * (term4 - term5 + term6);

        // Convert to degrees
        double latitude = lat * 180.0 / Math.PI;
        double longitude = lon * 180.0 / Math.PI;

        // Apply a minor datum correction shift to align Krassovsky / local VN2000 to standard WGS84 perfectly
        // (approximate datum shift parameters for Vietnam)
        latitude += 0.000045; 
        longitude += -0.000085;

        return new double[]{latitude, longitude};
    }

    /**
     * Inverse UTM projection for UTM Zone to WGS84.
     */
    private double[] convertUTMToWGS84(double easting, double northing, int zone, boolean northernHemisphere) {
        double a = 6378137.0;
        double f = 1.0 / 298.257223563;
        double k0 = 0.9996; // UTM scale factor
        double falseEasting = 500000.0;
        double falseNorthing = northernHemisphere ? 0.0 : 10000000.0;

        double e2 = 2 * f - f * f;
        double e4 = e2 * e2;
        double e6 = e4 * e2;
        double e_prime2 = e2 / (1 - e2);

        double M = (northing - falseNorthing) / k0;
        double mu = M / (a * (1 - e2 / 4.0 - 3 * e4 / 64.0 - 5 * e6 / 256.0));

        double e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
        double e1_2 = e1 * e1;
        double e1_3 = e1_2 * e1;
        double e1_4 = e1_3 * e1;

        double J1 = (3 * e1 / 2 - 27 * e1_3 / 32) * Math.sin(2 * mu);
        double J2 = (21 * e1_2 / 16 - 55 * e1_4 / 32) * Math.sin(4 * mu);
        double J3 = (151 * e1_3 / 96) * Math.sin(6 * mu);
        double J4 = (1097 * e1_4 / 512) * Math.sin(8 * mu);

        double fp = mu + J1 + J2 + J3 + J4;

        double e_cosfp = e_prime2 * Math.cos(fp) * Math.cos(fp);
        double N1 = a / Math.sqrt(1 - e2 * Math.sin(fp) * Math.sin(fp));
        double R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(fp) * Math.sin(fp), 1.5);
        double D = (easting - falseEasting) / (N1 * k0);

        double D2 = D * D;
        double D4 = D2 * D2;
        double D6 = D4 * D2;

        double tanfp = Math.tan(fp);
        double tanfp2 = tanfp * tanfp;
        double tanfp4 = tanfp2 * tanfp2;

        double fact1 = N1 * tanfp / R1;
        double term1 = D2 / 2.0;
        double term2 = (5 + 3 * tanfp2 + 10 * e_cosfp - 4 * e_cosfp * e_cosfp - 9 * e_prime2) * D4 / 24.0;
        double term3 = (61 + 90 * tanfp2 + 45 * tanfp4 + 350 * e_cosfp - 252 * e_prime2) * D6 / 720.0;
        double lat = fp - fact1 * (term1 - term2 + term3);

        double fact2 = 1.0 / Math.cos(fp);
        double term4 = D;
        double term5 = (1 + 2 * tanfp2 + e_cosfp) * D2 * D / 6.0;
        double term6 = (5 + 28 * tanfp2 + 24 * tanfp4 + 6 * e_cosfp + 8 * e_cosfp * e_cosfp) * D4 * D / 120.0;
        
        double centralMeridian = (zone * 6 - 183) * Math.PI / 180.0;
        double lon = centralMeridian + fact2 * (term4 - term5 + term6);

        return new double[]{
                lat * 180.0 / Math.PI,
                lon * 180.0 / Math.PI
        };
    }
}
