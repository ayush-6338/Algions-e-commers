import { useEffect, useState } from 'react';

const PLACEHOLDER = '/images/placeholder.svg';

export default function SafeImage({ src, alt, loading = 'lazy', width = 600, height = 600, className = '', ...props }) {
  const [useFallback, setUseFallback] = useState(false);
  useEffect(() => setUseFallback(false), [src]);

  return <img
    src={useFallback || !src ? PLACEHOLDER : src}
    alt={alt}
    width={width}
    height={height}
    loading={loading}
    decoding="async"
    onError={() => setUseFallback(true)}
    className={className}
    {...props}
  />;
}
