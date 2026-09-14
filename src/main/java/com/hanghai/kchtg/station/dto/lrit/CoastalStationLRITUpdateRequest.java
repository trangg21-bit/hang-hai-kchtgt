package com.hanghai.kchtg.station.dto.lrit;

import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@NoArgsConstructor
public class CoastalStationLRITUpdateRequest extends CoastalStationLRITRequest {

    @Override public void setOrgUnitId(UUID value) { markFieldPresent("orgUnitId"); super.setOrgUnitId(value); }
    @Override public void setOperatingOrgId(UUID value) { markFieldPresent("operatingOrgId"); super.setOperatingOrgId(value); }
    @Override public void setProvinceId(Integer value) { markFieldPresent("provinceId"); super.setProvinceId(value); }
    @Override public void setCode(String value) { markFieldPresent("code"); super.setCode(value); }
    @Override public void setStationCode(String value) { markFieldPresent("stationCode"); super.setStationCode(value); }
    @Override public void setName(String value) { markFieldPresent("name"); super.setName(value); }
    @Override public void setStationName(String value) { markFieldPresent("stationName"); super.setStationName(value); }
    @Override public void setLocationAddress(String value) { markFieldPresent("locationAddress"); super.setLocationAddress(value); }
    @Override public void setConditionStatus(ConditionStatus value) { markFieldPresent("conditionStatus"); super.setConditionStatus(value); }
    @Override public void setTerminalId(String value) { markFieldPresent("terminalId"); super.setTerminalId(value); }
    @Override public void setImoNumber(String value) { markFieldPresent("imoNumber"); super.setImoNumber(value); }
    @Override public void setReportingInterval(Integer value) { markFieldPresent("reportingInterval"); super.setReportingInterval(value); }
    @Override public void setAntennaHeight(Double value) { markFieldPresent("antennaHeight"); super.setAntennaHeight(value); }
    @Override public void setPowerOutput(Double value) { markFieldPresent("powerOutput"); super.setPowerOutput(value); }
    @Override public void setAntennaType(String value) { markFieldPresent("antennaType"); super.setAntennaType(value); }
    @Override public void setDataFormat(String value) { markFieldPresent("dataFormat"); super.setDataFormat(value); }
    @Override public void setCommunicationChannel(String value) { markFieldPresent("communicationChannel"); super.setCommunicationChannel(value); }
    @Override public void setCoverageArea(String value) { markFieldPresent("coverageArea"); super.setCoverageArea(value); }
    @Override public void setServicesProvided(String value) { markFieldPresent("servicesProvided"); super.setServicesProvided(value); }
    @Override public void setDescription(String value) { markFieldPresent("description"); super.setDescription(value); }
    @Override public void setContactPerson(String value) { markFieldPresent("contactPerson"); super.setContactPerson(value); }
    @Override public void setContactPhone(String value) { markFieldPresent("contactPhone"); super.setContactPhone(value); }
    @Override public void setSpatialId(UUID value) { markFieldPresent("spatialId"); super.setSpatialId(value); }
    @Override public void setSymbolId(UUID value) { markFieldPresent("symbolId"); super.setSymbolId(value); }
    @Override public void setGeometryType(String value) { markFieldPresent("geometryType"); super.setGeometryType(value); }
    @Override public void setObjectType(String value) { markFieldPresent("objectType"); super.setObjectType(value); }
    @Override public void setSymbol(String value) { markFieldPresent("symbol"); super.setSymbol(value); }
    @Override public void setCoordinateSystem(String value) { markFieldPresent("coordinateSystem"); super.setCoordinateSystem(value); }
    @Override public void setDisplayRule(String value) { markFieldPresent("displayRule"); super.setDisplayRule(value); }
    @Override public void setLatitude(BigDecimal value) { markFieldPresent("latitude"); super.setLatitude(value); }
    @Override public void setLongitude(BigDecimal value) { markFieldPresent("longitude"); super.setLongitude(value); }
    @Override public void setCoordinates(String value) { markFieldPresent("coordinates"); super.setCoordinates(value); }
}
