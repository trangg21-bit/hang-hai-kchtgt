package com.hanghai.kchtg.gis.search.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class KchtGis155ServiceTest {

    @Test
    void representativeCoordinateUsesLongitudeLatitudeOrderForPoint() {
        double[] coordinate = KchtGis155Service.representativeCoordinate(
                "POINT (106.721 20.864)", "POINT");

        assertThat(coordinate).containsExactly(20.864, 106.721);
    }

    @Test
    void representativeCoordinateUsesBoundingBoxCenterForPolygon() {
        double[] coordinate = KchtGis155Service.representativeCoordinate(
                "POLYGON ((106 20, 108 20, 108 22, 106 22, 106 20))", "POLYGON");

        assertThat(coordinate).containsExactly(21.0, 107.0);
    }

    @Test
    void representativeCoordinateDoesNotInventMissingGeometry() {
        assertThat(KchtGis155Service.representativeCoordinate(null, "POINT")).isNull();
        assertThat(KchtGis155Service.representativeCoordinate("", "POINT")).isNull();
    }
}
