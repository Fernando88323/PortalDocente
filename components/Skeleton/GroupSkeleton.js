import React from "react";
import ContentLoader from "react-content-loader";

const GroupSkeleton = (props) => (
  <ContentLoader
    speed={2}
    width={320}
    height={130}
    viewBox="0 0 320 130"
    backgroundColor="#d0e3ff" // Azul claro de fondo
    foregroundColor="#aac8ff" // Azul más vibrante para el efecto de brillo
    {...props}
  >
    {/* Título simulado */}
    <rect x="10" y="15" rx="8" ry="8" width="200" height="20" />
    {/* Simula una línea de descripción */}
    <rect x="10" y="45" rx="5" ry="5" width="280" height="10" />
    <rect x="10" y="65" rx="5" ry="5" width="240" height="10" />
    <rect x="10" y="85" rx="5" ry="5" width="260" height="10" />
    <rect x="10" y="105" rx="5" ry="5" width="150" height="10" />
  </ContentLoader>
);

export default GroupSkeleton;
