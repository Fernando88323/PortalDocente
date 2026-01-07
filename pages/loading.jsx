import React from "react";

export default function DashboardSkeleton() {
  // Define cuántas filas deseas mostrar mientras carga
  const skeletonRows = 8;

  return (
    <div className="p-6">
      {/* Título del listado */}
      <div className="mb-4">
        <div className="h-6 bg-gray-300 rounded w-1/4 animate-pulse"></div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="h-10 bg-gray-300 rounded w-1/3 animate-pulse"></div>
      </div>

      {/* Tabla “esqueleto” */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </th>
              <th className="px-4 py-2 text-left">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </th>
              <th className="px-4 py-2 text-left">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </th>
              <th className="px-4 py-2 text-left">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </th>
              <th className="px-4 py-2 text-left">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <tr key={index} className="border-b last:border-none">
                {/* ID EXPEDIENTE */}
                <td className="px-4 py-2">
                  <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                </td>
                {/* PRIMER NOMBRE */}
                <td className="px-4 py-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                </td>
                {/* SEGUNDO NOMBRE */}
                <td className="px-4 py-2">
                  <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                </td>
                {/* PRIMER APELLIDO */}
                <td className="px-4 py-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                </td>
                {/* SEGUNDO APELLIDO */}
                <td className="px-4 py-2">
                  <div className="h-4 bg-gray-300 rounded w-3/5 animate-pulse"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
