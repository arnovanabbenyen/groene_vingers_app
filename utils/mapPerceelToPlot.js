export function mapPerceelToPlot(row) {
  if (!row) return null;
  return {
    id: row.id,
    image: row.fotos?.[0] || null,
    fotos: row.fotos || [],
    location: row.plaats || 'Locatie nog niet beschikbaar',
    rating: null,
    title: row.naam,
    size: row.grootte ? `${row.grootte}m²` : null,
    description: row.beschrijving || null,
    voorzieningen: row.voorzieningen || [],
    extraInfo: row.extra_info || [],
    chips: row.voorzieningen || [],
    ownerId: row.owner_id,
    adres: row.adres || null,
    lat: row.lat || null,
    lng: row.lng || null,
    approximate_lat: row.approximate_lat || null,
    approximate_lng: row.approximate_lng || null,
    raw: row,
  };
}
