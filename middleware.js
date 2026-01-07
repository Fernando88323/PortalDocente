import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/grupos",
  "/estudiantes",
  "/evaluacion",
  "/mantenimiento",
  "/reportes",
  "/solicitudes",
  "/perfil",
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("accessToken")?.value;

  // console.log("Middleware ejecutado en:", pathname);
  // console.log("Token encontrado:", token ? "Sí" : "No");

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (pathname === "/" && token) {
    // console.log("Usuario autenticado, redirigiendo al dashboard...");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtected) {
    if (!token) {
      // console.log("Ruta protegida y no hay token. Redirigiendo al login...");
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/grupos/:path*",
    "/estudiantes/:path*",
    "/evaluacion/:path*",
    "/mantenimiento/:path*",
    "/reportes/:path*",
    "/solicitudes/:path*",
    "/perfil/:path*",
  ],
};
