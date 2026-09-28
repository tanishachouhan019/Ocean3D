import { useMemo } from 'react';
import { Entity } from 'resium';
import * as Cesium from 'cesium';
import { useOceanStore } from '../../stores/oceanStore';
import { getInterpolator, parseCssRgb } from '../../utils/colorUtils';

export default function OceanCutawayBlock() {
  const variable = useOceanStore((s) => s.variable);
  const selectedDepth = useOceanStore((s) => s.selectedDepth);
  const activePresetId = useOceanStore((s) => s.activePresetId);
  const colorPresets = useOceanStore((s) => s.colorPresets);
  const viewMode = useOceanStore((s) => s.viewMode);
  const activeRegion = useOceanStore((s) => s.activeRegion);

  const interpolator = useMemo(
    () => getInterpolator(activePresetId, colorPresets),
    [activePresetId, colorPresets]
  );

  const depthMeters = Math.min(800000, Math.max(300000, (selectedDepth / 1000) * 800000));

  const isAtlantic = activeRegion === 'atlantic';
  const west = isAtlantic ? -65.0 : 63.5;
  const east = isAtlantic ? -35.0 : 73.8;
  const south = isAtlantic ? 10.0 : 9.2;
  const north = isAtlantic ? 30.0 : 16.8;

  const wallBands = useMemo(() => {
    const numBands = 10;
    const bands = [];
    for (let i = 0; i < numBands; i++) {
      const tTop = i / numBands;
      const tBot = (i + 1) / numBands;
      const tMid = (tTop + tBot) / 2;
      const hTop = 100 - tTop * (depthMeters + 100);
      const hBot = 100 - tBot * (depthMeters + 100);

      const tColor = Math.exp(-tMid * 2.8);
      const css = interpolator(tColor);
      const color = Cesium.Color.fromCssColorString(css).withAlpha(0.85);
      const material = new Cesium.ColorMaterialProperty(color);

      bands.push({ index: i, hTop, hBot, material });
    }
    return bands;
  }, [depthMeters, interpolator]);

  const frontWallPositions = useMemo(() => {
    return Cesium.Cartesian3.fromDegreesArray([
      west, south,
      east, south,
    ]);
  }, [west, east, south]);

  const sideWallPositions = useMemo(() => {
    return Cesium.Cartesian3.fromDegreesArray([
      east, south,
      east, north,
    ]);
  }, [east, south, north]);

  const backWallPositions = useMemo(() => {
    return Cesium.Cartesian3.fromDegreesArray([
      east, north,
      west, north,
      west, south,
    ]);
  }, [west, east, south, north]);

  const wireframeEdges = useMemo(() => {
    const pTopSW = Cesium.Cartesian3.fromDegrees(west, south, 100);
    const pTopSE = Cesium.Cartesian3.fromDegrees(east, south, 100);
    const pTopNE = Cesium.Cartesian3.fromDegrees(east, north, 100);
    const pTopNW = Cesium.Cartesian3.fromDegrees(west, north, 100);

    const pBotSW = Cesium.Cartesian3.fromDegrees(west, south, -depthMeters);
    const pBotSE = Cesium.Cartesian3.fromDegrees(east, south, -depthMeters);
    const pBotNE = Cesium.Cartesian3.fromDegrees(east, north, -depthMeters);
    const pBotNW = Cesium.Cartesian3.fromDegrees(west, north, -depthMeters);

    return [
      [pTopSW, pTopSE, pTopNE, pTopNW, pTopSW],
      [pBotSW, pBotSE, pBotNE, pBotNW, pBotSW],
      [pTopSW, pBotSW],
      [pTopSE, pBotSE],
      [pTopNE, pBotNE],
      [pTopNW, pBotNW],
    ];
  }, [west, east, south, north, depthMeters]);

  if (viewMode === 'map2d') return null;

  return (
    <>
      {wallBands.map((band) => (
        <div key={`wall-band-${band.index}`}>
          <Entity
            name={`Cutaway Front Wall Band ${band.index}`}
            wall={{
              positions: frontWallPositions,
              maximumHeights: [band.hTop, band.hTop],
              minimumHeights: [band.hBot, band.hBot],
              material: band.material,
            }}
          />
          <Entity
            name={`Cutaway Side Wall Band ${band.index}`}
            wall={{
              positions: sideWallPositions,
              maximumHeights: [band.hTop, band.hTop],
              minimumHeights: [band.hBot, band.hBot],
              material: band.material,
            }}
          />
          <Entity
            name={`Cutaway Interior Wall Band ${band.index}`}
            wall={{
              positions: backWallPositions,
              maximumHeights: [band.hTop, band.hTop, band.hTop],
              minimumHeights: [band.hBot, band.hBot, band.hBot],
              material: band.material,
            }}
          />
        </div>
      ))}

      {wireframeEdges.map((positions, idx) => (
        <Entity
          key={`wireframe-edge-${idx}`}
          polyline={{
            positions,
            width: 2.2,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              taperPower: 0.1,
              color: Cesium.Color.fromCssColorString('#38bdf8'),
            }),
            clampToGround: false,
          }}
        />
      ))}

      <Entity
        name={`Horizontal Depth Slice (${selectedDepth}m)`}
        polygon={{
          hierarchy: Cesium.Cartesian3.fromDegreesArray([
            west, south,
            east, south,
            east, north,
            west, north,
          ]),
          height: -depthMeters,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(interpolator(Math.exp(-Math.min(1, selectedDepth / 1000) * 2.5))).withAlpha(0.85)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
        }}
      />

      <Entity
        position={Cesium.Cartesian3.fromDegrees(west + 0.6, south + 0.6, -depthMeters + 20000)}
        label={{
          text: `Depth Slice: ${selectedDepth} m`,
          font: 'bold 13px sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
          backgroundColor: Cesium.Color.fromCssColorString('#020617').withAlpha(0.85),
          showBackground: true,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }}
      />
    </>
  );
}
