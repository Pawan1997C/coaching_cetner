import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from './api';

export function useFetch<T = any>(url: string | null, params?: Record<string, any>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState('');
  const key = JSON.stringify(params ?? {});

  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const clean = Object.fromEntries(Object.entries(JSON.parse(key)).filter(([, v]) => v !== '' && v != null));
      setData((await api.get(url, { params: clean })).data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
