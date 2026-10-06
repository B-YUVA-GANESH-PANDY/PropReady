import React, { useState, useEffect } from 'react';
import { SVG_FALLBACKS } from '../utils/propertyImages';

export const PropertyImage = ({ src, alt = "Property", className = "", fallbackType = "property" }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallbackSrc = SVG_FALLBACKS[fallbackType] || SVG_FALLBACKS.document || SVG_FALLBACKS.property;

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  const activeSrc = error || !src ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}
      <img
        src={activeSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded || error ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

