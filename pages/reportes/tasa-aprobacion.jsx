import React from "react";
import Head from "next/head";
import TasaAprobacionPanel from "@/components/TasaAprobacionPanel";

export default function TasaAprobacionPage() {
  return (
    <>
      <Head>
        <title>Tasa de Aprobación - Reportes</title>
      </Head>
      <TasaAprobacionPanel />
    </>
  );
}
