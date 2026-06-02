import { useEffect, useState } from 'react';

const LOCATIONIQ_ENDPOINT = 'https://us1.locationiq.com/v1/autocomplete.php';
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const COUNTRY_CODES = 'be,nl';
const LIMIT = 10; // fetch more so dedup leaves enough after filtering

const PLACE_TYPES = new Set(['city', 'town', 'village', 'hamlet', 'municipality']);

export function useLocationSearch(query) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const trimmed = (query || '').trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const apiKey = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
    if (!apiKey) {
      setError('Locatie-service niet geconfigureerd');
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          key: apiKey,
          q: trimmed,
          format: 'json',
          limit: String(LIMIT),
          countrycodes: COUNTRY_CODES,
        });

        const response = await fetch(`${LOCATIONIQ_ENDPOINT}?${params}`);

        if (!response.ok) {
          // LocationIQ returns 404 when no results — not a real error
          if (response.status === 404) {
            if (!cancelled) {
              setSuggestions([]);
              setLoading(false);
            }
            return;
          }
          throw new Error(`Locatie-zoekopdracht mislukt (${response.status})`);
        }

        const data = await response.json();
        if (cancelled) return;

        const mapped = (Array.isArray(data) ? data : [])
          .filter((item) => item.class === 'place' && PLACE_TYPES.has(item.type))
          .map((item) => {
            // Use the place's own name (first segment of display_name), not its containing city
            const plaats = (item.display_name || '').split(',')[0].trim();
            return {
              id: String(item.place_id || `${item.lat}-${item.lon}`),
              displayName: item.display_name || '',
              plaats,
              adres: item.display_name || '',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          })
          .filter((s) => s.plaats)
          .filter((s) => s.plaats.toLowerCase().startsWith(trimmed.toLowerCase()))
          .filter((s, i, arr) => arr.findIndex((o) => o.plaats === s.plaats) === i)
          .slice(0, 5);

        setSuggestions(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Onbekende fout');
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { suggestions, loading, error };
}
