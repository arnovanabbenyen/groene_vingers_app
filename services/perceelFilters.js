function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function passesFilters(perceel, filters, userLocation) {
  if (
    filters.maxAfstand < 15 &&
    userLocation &&
    (perceel.approximate_lat != null || perceel.lat != null)
  ) {
    const pLat = perceel.approximate_lat ?? perceel.lat;
    const pLon = perceel.approximate_lng ?? perceel.lng;
    if (pLat != null && pLon != null) {
      const km = haversineKm(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(pLat),
        parseFloat(pLon),
      );
      if (km > filters.maxAfstand) return false;
    }
  }

  if (filters.voorzieningen.length > 0) {
    const perceelVoorz = (perceel.voorzieningen || []).map((v) =>
      String(v).toLowerCase(),
    );
    const allPresent = filters.voorzieningen.every((v) =>
      perceelVoorz.includes(String(v).toLowerCase()),
    );
    if (!allPresent) return false;
  }

  if (filters.grootte && filters.grootte !== 'any') {
    const g = perceel.grootte != null ? Number(perceel.grootte) : null;
    if (g == null) return false;
    if (filters.grootte === '<10' && g >= 10) return false;
    if (filters.grootte === '10-30' && (g < 10 || g > 30)) return false;
    if (filters.grootte === '30+' && g <= 30) return false;
  }

  if (filters.samenwerking.length > 0) {
    const perceelTypes = perceel.voorkeur_samenwerking || [];
    const hasMatch = filters.samenwerking.some((t) => perceelTypes.includes(t));
    if (!hasMatch) return false;
  }

  return true;
}

export function countMatchingPercelen(percelen, filters, userLocation) {
  return percelen.filter((p) => passesFilters(p, filters, userLocation)).length;
}

export const DEFAULT_FILTERS = {
  maxAfstand: 15,
  voorzieningen: [],
  grootte: 'any',
  samenwerking: [],
};

export function hasActiveFilters(filters) {
  return (
    filters.maxAfstand < 15 ||
    filters.voorzieningen.length > 0 ||
    (filters.grootte && filters.grootte !== 'any') ||
    filters.samenwerking.length > 0
  );
}

export function activeFiltersCount(filters) {
  let count = 0;
  if (filters.maxAfstand < 15) count++;
  if (filters.voorzieningen.length > 0) count++;
  if (filters.grootte && filters.grootte !== 'any') count++;
  if (filters.samenwerking.length > 0) count++;
  return count;
}
