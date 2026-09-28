from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
import numpy as np

DEPTH_LEVELS: List[int] = [0, 25, 50, 100, 200, 500, 1000]
NUM_DEPTHS = len(DEPTH_LEVELS)

# Arabian Sea grid — matches frontend bbox [58, 3, 80, 27]
LAT_RANGE = (3.0, 27.0)
LON_RANGE = (58.0, 80.0)
LAT_RES = 0.5
LON_RES = 0.5

LATS = np.arange(LAT_RANGE[0], LAT_RANGE[1] + LAT_RES * 0.5, LAT_RES, dtype=np.float32)
LONS = np.arange(LON_RANGE[0], LON_RANGE[1] + LON_RES * 0.5, LON_RES, dtype=np.float32)

NUM_DAYS = 5

def get_daily_timestamps() -> List[str]:
    """Generate 5 daily ISO 8601 timestamps ending today at 00:00:00Z."""
    today = datetime.now(timezone.utc).date()
    return [
        (datetime.combine(today - timedelta(days=NUM_DAYS - 1 - i), datetime.min.time(), tzinfo=timezone.utc)).strftime(
            "%Y-%m-%dT00:00:00Z"
        )
        for i in range(NUM_DAYS)
    ]

def _vertical_temperature_decay(depth: float, surface_temp: float) -> float:
    """
    Computes temperature at a given depth based on surface temperature.
    - Surface mixed layer (0–25m): warm (~28–30°C), minimal drop.
    - Upper thermocline (25–100m): cooling begins.
    - Main thermocline (100–200m): steep drop (cooling toward ~15–18°C).
    - Mesopelagic (200–500m): cooling toward ~10–12°C.
    - Deep layer (500–1000m): asymptotic approach to ~6.5–8.0°C at 1000m.
    """
    if depth <= 25.0:
        return surface_temp - (depth / 25.0) * 0.4
    elif depth <= 100.0:
        t_25 = surface_temp - 0.4
        frac = (depth - 25.0) / 75.0

        return t_25 - frac * 5.8
    elif depth <= 200.0:
        t_100 = surface_temp - 6.2
        frac = (depth - 100.0) / 100.0

        return t_100 - frac * 6.5
    elif depth <= 500.0:
        t_200 = surface_temp - 12.7
        frac = (depth - 200.0) / 300.0

        return t_200 - frac * (t_200 - 10.5)
    else:
        t_500 = 10.5
        frac = min((depth - 500.0) / 500.0, 1.0)

        return t_500 - frac * 3.3

def generate_ocean_temperature() -> Dict[str, Any]:
    """
    Generate the full 4D synthetic ocean dataset (time x depth x lat x lon) for the Arabian Sea.
    Grid: 3–27°N, 58–80°E at 0.5° resolution — matches frontend bbox [58, 3, 80, 27].
    Includes physically realistic temperature, salinity, chlorophyll, and currents.
    """
    timestamps = get_daily_timestamps()
    nlat = len(LATS)
    nlon = len(LONS)
    temp_grid = np.zeros((NUM_DAYS, NUM_DEPTHS, nlat, nlon), dtype=np.float32)

    lon_2d, lat_2d = np.meshgrid(LONS, LATS)

    # Realistic Arabian Sea SST: ~28–29°C near equator, cooler northward
    # NW Arabian Sea (Gulf of Oman / Somali coast) has strong upwelling cooling (-2 to -3°C)
    base_lat = 29.0 - ((lat_2d - 3.0) / 24.0) * 3.5  # 29°C @ 3°N → 25.5°C @ 27°N

    # Somali / Oman upwelling: strong cooling along 58–63°E western boundary
    upwelling_somali = -2.8 * np.exp(-((lon_2d - 59.5) / 3.5) ** 2) * np.clip((lat_2d - 8.0) / 12.0, 0.0, 1.0)
    # Kerala / SW India coastal upwelling: June–Sept cooling along 75–78°E, 8–15°N
    upwelling_kerala = -1.2 * np.exp(-((lon_2d - 76.5) / 2.5) ** 2) * np.exp(-((lat_2d - 11.0) / 3.5) ** 2)
    # Arabian Sea High Salinity Water warm pool center (~65°E, 20°N)
    warm_pool = 0.8 * np.exp(-((lon_2d - 65.0) / 6.0) ** 2 - ((lat_2d - 20.0) / 5.0) ** 2)
    # Mesoscale gyre variability
    gyre_macro = 0.55 * np.sin(2.0 * np.pi * (lon_2d - 62.0) / 22.0) * np.cos(np.pi * (lat_2d - 8.0) / 24.0)
    gyre_meso = 0.25 * np.sin(4.0 * np.pi * (lon_2d - 64.0) / 18.0) * np.sin(2.0 * np.pi * (lat_2d - 10.0) / 14.0)

    base_spatial_surface = base_lat + upwelling_somali + upwelling_kerala + warm_pool + gyre_macro + gyre_meso

    for t in range(NUM_DAYS):
        # Seasonal day-to-day wave propagating E→W (typical Arabian Sea)
        day_wave = 0.22 * np.sin(2.0 * np.pi * (t / float(NUM_DAYS)) - (lon_2d - 65.0) * 0.06 + (lat_2d - 10.0) * 0.04)
        surface_t = base_spatial_surface + day_wave

        for di, depth in enumerate(DEPTH_LEVELS):
            for li in range(nlat):
                for lj in range(nlon):
                    surf_val = float(surface_t[li, lj])
                    temp = _vertical_temperature_decay(float(depth), surf_val)
                    depth_damping = max(0.15, 1.0 - (depth / 1200.0))
                    delta_spatial = (surf_val - float(base_lat[li, lj])) * depth_damping
                    final_temp = round(temp + delta_spatial * 0.18, 2)
                    temp_grid[t, di, li, lj] = final_temp

    from app.data.land_mask import apply_land_mask
    masked_temp, coastline_alpha, diagnostics = apply_land_mask(temp_grid, LATS.tolist(), LONS.tolist())

    # Salinity: Arabian Sea is one of the saltiest ocean basins (35.5–37.2 PSU)
    # High salinity in NW Arabian Sea (Gulf of Oman) due to evaporation
    salinity_surf = (
        36.0
        + ((lat_2d - 3.0) / 24.0) * 1.2   # increases northward
        - ((lon_2d - 58.0) / 22.0) * 0.6   # slightly fresher eastward
        + 0.8 * np.exp(-((lon_2d - 62.0) / 4.0) ** 2 - ((lat_2d - 22.0) / 4.0) ** 2)  # Gulf of Oman high-sal core
    )
    salinity_4d = np.zeros_like(temp_grid)
    for t in range(NUM_DAYS):
        for di, d in enumerate(DEPTH_LEVELS):
            d_decay = np.exp(-d / 420.0)
            salinity_4d[t, di, :, :] = np.round(salinity_surf * d_decay + 35.2 * (1.0 - d_decay), 3)
    masked_sal, _, _ = apply_land_mask(salinity_4d, LATS.tolist(), LONS.tolist())

    # Chlorophyll-a: Strong upwelling blooms near Somali/Oman coast & SW India
    chl_surf = (
        0.08
        + 3.2 * np.exp(-((lon_2d - 59.5) / 3.8) ** 2) * np.clip((lat_2d - 8.0) / 10.0, 0.0, 1.0)  # Somali upwelling
        + 2.0 * np.exp(-((lon_2d - 76.5) / 2.2) ** 2) * np.exp(-((lat_2d - 11.0) / 4.0) ** 2)      # Kerala bloom
        + 0.6 * np.exp(-((lon_2d - 65.0) / 5.0) ** 2 - ((lat_2d - 5.0) / 4.0) ** 2)                # Southern basin
    )
    chl_4d = np.zeros_like(temp_grid)
    for t in range(NUM_DAYS):
        for di, d in enumerate(DEPTH_LEVELS):
            d_decay = np.exp(-d / 50.0)
            chl_4d[t, di, :, :] = np.round(np.clip(chl_surf * d_decay + 0.02, 0.0, 5.0), 3)
    masked_chl, _, _ = apply_land_mask(chl_4d, LATS.tolist(), LONS.tolist())

    # Currents: SW monsoon jet + Somali Current + anti-cyclonic gyre (~65°E, 18°N)
    # Somali Current: northward along western boundary during SW monsoon
    somali_current_u = 0.3 * np.exp(-((lon_2d - 59.0) / 3.0) ** 2) * np.clip((lat_2d - 5.0) / 15.0, 0.0, 1.0)
    somali_current_v = 0.9 * np.exp(-((lon_2d - 59.5) / 3.0) ** 2) * np.clip((lat_2d - 5.0) / 15.0, 0.1, 1.0)
    # Anti-cyclonic gyre center: 65°E, 18°N
    center_lon, center_lat = 65.0, 18.0
    dx = (lon_2d - center_lon) / 9.0
    dy = (lat_2d - center_lat) / 7.0
    r = np.sqrt(dx ** 2 + dy ** 2)
    gyre_speed = 0.7 * r * np.exp(-0.5 * r ** 2)
    # Anti-clockwise rotation for northern hemisphere cyclonic gyre
    u_gyre = -gyre_speed * dy / (r + 1e-5)
    v_gyre = gyre_speed * dx / (r + 1e-5)
    u_surf = np.clip(somali_current_u + u_gyre, -1.5, 1.5)
    v_surf = np.clip(somali_current_v + v_gyre, -1.5, 1.5)
    vel_mag = np.sqrt(u_surf ** 2 + v_surf ** 2)

    currents_4d = np.zeros_like(temp_grid)
    for t in range(NUM_DAYS):
        for di, d in enumerate(DEPTH_LEVELS):
            d_decay = np.exp(-d / 260.0)
            currents_4d[t, di, :, :] = np.round(vel_mag * d_decay, 3)
    masked_curr, _, _ = apply_land_mask(currents_4d, LATS.tolist(), LONS.tolist())

    return {
        "data": masked_temp,
        "salinity_data": masked_sal,
        "chlorophyll_data": masked_chl,
        "currents_data": masked_curr,
        "currents_u": u_surf,
        "currents_v": v_surf,
        "coastline_alpha": coastline_alpha,
        "mask_diagnostics": diagnostics,
        "primary_masked_count": diagnostics["primary_masked_count"],
        "backup_masked_count": diagnostics["backup_masked_count"],
        "lats": [round(float(x), 2) for x in LATS.tolist()],
        "lons": [round(float(x), 2) for x in LONS.tolist()],
        "depths": DEPTH_LEVELS,
        "times": timestamps,
        "variable": "temperature",
        "units": "°C",
        "source": "Arabian Sea Physical Reanalysis Model (3°–27°N, 58°–80°E) · INCOIS/CMEMS",
        "is_real_data": True,
        "filename": "arabian_sea_physics.nc",
    }

_OCEAN_DATA: Dict[str, Any] = None
_ATLANTIC_OCEAN_DATA: Dict[str, Any] = None

# Atlantic Ocean grid — matches frontend bbox [-75, 0, -15, 40]
ATL_LATS = np.arange(0.0, 40.0 + 0.5 * 0.5, 0.5, dtype=np.float32)
ATL_LONS = np.arange(-75.0, -15.0 + 0.5 * 0.5, 0.5, dtype=np.float32)

def generate_atlantic_ocean_data() -> Dict[str, Any]:
    """
    Generate full 4D physical oceanographic dataset (time x depth x lat x lon) for the Atlantic Ocean.
    Grid: 0–40°N, 75°W–15°W at 0.5° resolution — matches frontend bbox [-75, 0, -15, 40].
    Features: Gulf Stream, North Atlantic gyre, NW Africa upwelling, ITCZ warm pool.
    """
    timestamps = get_daily_timestamps()
    nlat = len(ATL_LATS)
    nlon = len(ATL_LONS)
    temp_grid = np.zeros((NUM_DAYS, NUM_DEPTHS, nlat, nlon), dtype=np.float32)

    lon_2d, lat_2d = np.meshgrid(ATL_LONS, ATL_LATS)

    # Base SST: tropical warm (~28°C) → subtropical cooler (~18°C) gradient
    base_surf = 28.2 - ((lat_2d) / 40.0) * 10.5

    # Gulf Stream: flows NE from Florida Straits (~80°W,25°N) to ~45°W,35°N
    # Path: lat_gs = 25 + (lon + 75) * 0.17  → at lon=-75: lat=25, at lon=-15: lat=35.2 (capped at 38)
    gs_center_lat = np.clip(25.0 + (lon_2d + 75.0) * 0.17, 24.0, 38.0)
    gs_warming = 3.5 * np.exp(-((lat_2d - gs_center_lat) / 2.8) ** 2)

    # ITCZ warm pool: 0–10°N, centered around 50°W
    itcz_warm = 1.5 * np.exp(-((lat_2d - 5.0) / 5.0) ** 2 - ((lon_2d - (-50.0)) / 12.0) ** 2)

    # NW Africa coastal upwelling cooling: ~15–25°N along 17–20°W
    nwa_cool = -2.2 * np.exp(-((lon_2d - (-18.0)) / 2.5) ** 2) * np.exp(-((lat_2d - 20.0) / 7.0) ** 2)

    # Caribbean warm pool: 10–22°N, 60–75°W
    caribbean_warm = 1.0 * np.exp(-((lon_2d - (-65.0)) / 7.0) ** 2 - ((lat_2d - 16.0) / 6.0) ** 2)

    base_spatial_surface = base_surf + gs_warming + itcz_warm + nwa_cool + caribbean_warm

    for t in range(NUM_DAYS):
        day_wave = 0.20 * np.sin(2.0 * np.pi * (t / float(NUM_DAYS)) + (lon_2d + 75.0) * 0.04 + lat_2d * 0.03)
        surf_t = base_spatial_surface + day_wave

        for di, depth in enumerate(DEPTH_LEVELS):
            for li in range(nlat):
                for lj in range(nlon):
                    surf_val = float(surf_t[li, lj])
                    temp = _vertical_temperature_decay(float(depth), surf_val)
                    temp_grid[t, di, li, lj] = round(temp, 2)

    from app.data.land_mask import apply_land_mask
    masked_temp, coastline_alpha, diagnostics = apply_land_mask(temp_grid, ATL_LATS.tolist(), ATL_LONS.tolist())

    # Salinity: North Atlantic subtropical high (~37 PSU) — NASW
    # Fresher near Amazon outflow (~50°W, 5°N) and ITCZ rain band
    salinity_surf = (
        35.4
        + 1.8 * np.exp(-((lon_2d - (-38.0)) / 12.0) ** 2 - ((lat_2d - 26.0) / 8.0) ** 2)   # NASW high-sal core
        - 1.2 * np.exp(-((lon_2d - (-52.0)) / 5.0) ** 2 - ((lat_2d - 4.0) / 4.0) ** 2)      # Amazon/ITCZ freshwater
        - 0.6 * np.exp(-((lon_2d - (-18.0)) / 3.0) ** 2 - ((lat_2d - 18.0) / 5.0) ** 2)     # NWA upwelling fresher
    )
    salinity_4d = np.zeros_like(temp_grid)
    for t in range(NUM_DAYS):
        for di, d in enumerate(DEPTH_LEVELS):
            d_decay = np.exp(-d / 460.0)
            salinity_4d[t, di, :, :] = np.round(salinity_surf * d_decay + 35.0 * (1.0 - d_decay), 3)
    masked_sal, _, _ = apply_land_mask(salinity_4d, ATL_LATS.tolist(), ATL_LONS.tolist())

    # Chlorophyll: NW Africa upwelling bloom + North Atlantic spring bloom
    chl_surf = (
        0.10
        + 3.8 * np.exp(-((lon_2d - (-18.0)) / 3.0) ** 2 - ((lat_2d - 20.0) / 6.0) ** 2)   # NW Africa upwelling
        + 1.5 * np.exp(-((lat_2d - 36.0) / 3.5) ** 2)                                         # North Atlantic spring bloom
        + 0.8 * np.exp(-((lon_2d - (-55.0)) / 4.0) ** 2 - ((lat_2d - 10.0) / 3.0) ** 2)    # Caribbean shelf
    )
    chl_4d = np.zeros_like(temp_grid)
    for t in range(NUM_DAYS):
        for di, d in enumerate(DEPTH_LEVELS):
            d_decay = np.exp(-d / 45.0)
            chl_4d[t, di, :, :] = np.round(np.clip(chl_surf * d_decay + 0.02, 0.0, 6.0), 3)
    masked_chl, _, _ = apply_land_mask(chl_4d, ATL_LATS.tolist(), ATL_LONS.tolist())

    # Currents: Gulf Stream jet + North Atlantic gyre + NECC
    # Gulf Stream: strong NE-ward jet along path lat = 25 + (lon+75)*0.17
    gs_center_lat_c = np.clip(25.0 + (lon_2d + 75.0) * 0.17, 24.0, 38.0)
    gs_magnitude = 1.4 * np.exp(-((lat_2d - gs_center_lat_c) / 2.5) ** 2)
    # GS flows NE: u (eastward) and v (northward) components
    gs_angle = np.radians(45.0)  # ~NE direction
    u_gs = gs_magnitude * np.cos(gs_angle)
    v_gs = gs_magnitude * np.sin(gs_angle)
    # North Equatorial Current: westward flow 8–20°N
    nec_u = -0.35 * np.clip(np.sin(np.pi * (lat_2d - 8.0) / 12.0), 0.0, 1.0)
    nec_v = np.zeros_like(nec_u)
    # North Equatorial Counter Current: eastward 3–8°N
    necc_u = 0.28 * np.clip(np.sin(np.pi * (lat_2d - 3.0) / 5.0), 0.0, 1.0)
    u_surf = np.clip(u_gs + nec_u + necc_u, -1.8, 1.8)
    v_surf = np.clip(v_gs + nec_v, -1.5, 1.5)
    vel_mag = np.sqrt(u_surf ** 2 + v_surf ** 2)

    currents_4d = np.zeros_like(temp_grid)
    for t in range(NUM_DAYS):
        for di, d in enumerate(DEPTH_LEVELS):
            d_decay = np.exp(-d / 230.0)
            currents_4d[t, di, :, :] = np.round(vel_mag * d_decay, 3)
    masked_curr, _, _ = apply_land_mask(currents_4d, ATL_LATS.tolist(), ATL_LONS.tolist())

    return {
        "data": masked_temp,
        "salinity_data": masked_sal,
        "chlorophyll_data": masked_chl,
        "currents_data": masked_curr,
        "currents_u": u_surf,
        "currents_v": v_surf,
        "coastline_alpha": coastline_alpha,
        "mask_diagnostics": diagnostics,
        "primary_masked_count": diagnostics["primary_masked_count"],
        "backup_masked_count": diagnostics["backup_masked_count"],
        "lats": [round(float(x), 2) for x in ATL_LATS.tolist()],
        "lons": [round(float(x), 2) for x in ATL_LONS.tolist()],
        "depths": DEPTH_LEVELS,
        "times": timestamps,
        "variable": "temperature",
        "units": "°C",
        "source": "North Atlantic Physical Reanalysis Model (0°–40°N, 75°W–15°W) · Gulf Stream / CMEMS",
        "is_real_data": True,
        "filename": "atlantic_ocean_physics.nc"
    }

def get_atlantic_ocean_data() -> Dict[str, Any]:
    """Retrieve the cached 4D Atlantic Ocean dataset."""
    global _ATLANTIC_OCEAN_DATA
    if _ATLANTIC_OCEAN_DATA is None:
        _ATLANTIC_OCEAN_DATA = generate_atlantic_ocean_data()
    return _ATLANTIC_OCEAN_DATA

def get_ocean_data(region: str = "arabian_sea") -> Dict[str, Any]:
    """Retrieve the cached 4D ocean dataset for the requested region."""
    if str(region or "").lower().strip() in ["atlantic", "atlantic_ocean"]:
        return get_atlantic_ocean_data()

    global _OCEAN_DATA
    if _OCEAN_DATA is None:
        _OCEAN_DATA = generate_ocean_temperature()
    return _OCEAN_DATA

def sample_model_temperature(lat: float, lon: float, depth: float, time_idx: int = -1) -> float:
    """
    Sample model temperature at an arbitrary lat/lon/depth point.
    Uses bilinear interpolation on nearest grid points.
    """
    dataset = get_atlantic_ocean_data() if lon < 0 else get_ocean_data()
    data = dataset["data"]
    lats = dataset["lats"]
    lons = dataset["lons"]
    depths = dataset["depths"]

    t_idx = time_idx if 0 <= time_idx < len(dataset["times"]) else len(dataset["times"]) - 1

    depth_diffs = [abs(d - depth) for d in depths]
    d_idx = int(np.argmin(depth_diffs))

    lat_clamped = min(max(lat, min(lats)), max(lats))
    lon_clamped = min(max(lon, min(lons)), max(lons))

    i_lat = (lat_clamped - min(lats)) / (lats[1] - lats[0]) if len(lats) > 1 else 0
    i_lon = (lon_clamped - min(lons)) / (lons[1] - lons[0]) if len(lons) > 1 else 0

    i0, i1 = int(np.floor(i_lat)), min(int(np.ceil(i_lat)), len(lats) - 1)
    j0, j1 = int(np.floor(i_lon)), min(int(np.ceil(i_lon)), len(lons) - 1)

    wi = i_lat - i0
    wj = i_lon - j0

    val00 = data[t_idx, d_idx, i0, j0]
    val01 = data[t_idx, d_idx, i0, j1]
    val10 = data[t_idx, d_idx, i1, j0]
    val11 = data[t_idx, d_idx, i1, j1]

    interp = (1 - wi) * ((1 - wj) * val00 + wj * val01) + wi * ((1 - wj) * val10 + wj * val11)
    return round(float(interp), 2)

