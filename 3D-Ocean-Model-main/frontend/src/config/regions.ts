
export interface OceanRegion {
    name: string;
    lat: number;
    lon: number;
    bbox: [number, number, number, number];
    subtitle?: string;
}

export const OCEAN_REGIONS: OceanRegion[] = [
  {
    name: 'Arabian Sea',
    lat: 15.0,
    lon: 67.0,
    bbox: [58, 3, 80, 27],
    subtitle: 'INCOIS · Copernicus',
  },
  {
    name: 'Atlantic Ocean',
    lat: 20.0,
    lon: -45.0,
    bbox: [-75, 0, -15, 40],
    subtitle: 'Gulf Stream · CMEMS',
  },
];
