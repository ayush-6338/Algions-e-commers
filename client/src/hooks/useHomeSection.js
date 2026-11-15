import { useCallback, useEffect, useState } from 'react';

export default function useHomeSection(loader, dependency = '') {
  const [state, setState] = useState({ data: [], loading: false, error: '' });
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    let active = true;
    if (!dependency) { setState({ data: [], loading: false, error: '' }); return () => { active = false; }; }
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    loader().then((data) => { if (active) setState({ data, loading: false, error: '' }); })
      .catch((error) => { if (active) setState({ data: [], loading: false, error: error.response?.data?.message || 'Could not load this section.' }); });
    return () => { active = false; };
  }, [loader, dependency, retryKey]);
  const retry = useCallback(() => setRetryKey((value) => value + 1), []);
  return { ...state, retry };
}
