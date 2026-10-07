// Central place for build-time settings (see client/.env.example).
const clean = (url?: string) => (url ?? '').trim().replace(/\/+$/, '');

/** Base URL for every API call. Defaults to same-origin `/api`, which the Vite dev server proxies to the backend. */
export const API_URL = clean(import.meta.env.VITE_API_URL) || '/api';
