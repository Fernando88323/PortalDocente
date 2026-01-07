import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

const isValidMicrosoftEmail = (email) =>
  /^[^\s@]+@(usonsonate\.edu\.sv|outlook\.com)$/i.test(email);

export default function Login() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleEmailChange = (e) => {
    setUsuario(e.target.value);
    setTimeout(() => {
      if (
        isEmailFocused &&
        e.target.value &&
        !isValidMicrosoftEmail(e.target.value)
      ) {
        setErrorMessage("Correo electrónico no válido.");
      } else {
        setErrorMessage("");
      }
    }, 300);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoadingMessage("");

    if (!usuario || !contrasenia) {
      setErrorMessage("Ingrese correo y contraseña.");
      return;
    }

    if (!isValidMicrosoftEmail(usuario)) {
      setErrorMessage("Correo electrónico no válido.");
      return;
    }

    try {
      const NEXT_PUBLIC_LOGIN = process.env.NEXT_PUBLIC_LOGIN;
      const response = await fetch(NEXT_PUBLIC_LOGIN, {
        method: "POST",
        credentials: "include",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Usuario: usuario, Contrasenia: contrasenia }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || "Credenciales incorrectas.");
        return;
      }
      setLoadingMessage("Iniciando...");
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage("Error al iniciar sesión.");
    }
  };

  return (
    <>
      <Head>
        <title>Acceso Docente USO</title>
      </Head>
      {/* Override autofill background */}
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          box-shadow: 0 0 0px 1000px white inset !important;
        }
      `}</style>
      <section className="bg-gradient-to-br from-blue-500 via-blue-400 to-blue-300 h-screen flex items-center justify-center p-6">
        <div className="flex flex-wrap items-center justify-center lg:justify-between max-w-5xl w-full">
          <div className="hidden lg:block w-6/12 animate-fade-in-left">
            <img
              src="/imagenes/Uso-sin-fondo.png"
              className="w-full rounded-lg"
              alt="Imagen de Acceso Profesional"
            />
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-green-50 shadow-xl rounded-xl p-8 w-full max-w-md animate-fade-in border border-blue-200">
            <h2 className="text-3xl font-semibold text-blue-800 text-center mb-8">
              Acceso Profesional
            </h2>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Campo de correo */}
              <div className="relative">
                <div
                  className={`relative rounded-md border-2 bg-white/80 backdrop-blur-sm transition-colors duration-200 ${
                    isEmailFocused || usuario
                      ? "border-blue-600"
                      : "border-blue-300"
                  }`}
                >
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="block w-full pl-10 pr-4 py-3 bg-transparent text-gray-800 rounded-md focus:outline-none"
                    placeholder=" "
                    value={usuario}
                    onChange={handleEmailChange}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    autoComplete="username"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-gray-500"
                    />
                  </div>
                  <label
                    htmlFor="email"
                    className={`absolute left-10 px-1 bg-white/90 transition-all duration-200 pointer-events-none ${
                      usuario || isEmailFocused
                        ? "-top-3 text-xs text-blue-600"
                        : "top-1/2 -translate-y-1/2 text-base text-gray-500"
                    }`}
                  >
                    Correo electrónico
                  </label>
                </div>
              </div>

              {/* Campo de contraseña */}
              <div className="relative">
                <div
                  className={`relative rounded-md border-2 bg-white/80 backdrop-blur-sm transition-colors duration-200 ${
                    isPasswordFocused || contrasenia
                      ? "border-green-600"
                      : "border-green-300"
                  }`}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="block w-full pl-10 pr-16 py-3 bg-transparent text-gray-800 rounded-md focus:outline-none"
                    placeholder=" "
                    value={contrasenia}
                    onChange={(e) => setContrasenia(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    autoComplete="current-password"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="text-gray-500" />
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="text-gray-500 hover:text-green-500 transition-colors duration-200"
                      onClick={togglePasswordVisibility}
                    />
                  </div>
                  <label
                    htmlFor="password"
                    className={`absolute left-10 px-1 bg-white/90 transition-all duration-200 pointer-events-none ${
                      contrasenia || isPasswordFocused
                        ? "-top-3 text-xs text-green-600"
                        : "top-1/2 -translate-y-1/2 text-base text-gray-500"
                    }`}
                  >
                    Contraseña
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-md shadow-lg hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50"
                disabled={Boolean(loadingMessage)}
              >
                {loadingMessage ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-3 inline-block"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8V0c-3.87 0-7 3.13-7 7h4zm2 5a5 5 0 10-5-5H2a7 7 0 017 7v-2zm10-8a3 3 0 10-3-3V6a5 5 0 015 5h-2z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                ) : (
                  <div className="flex items-center justify-center">
                    <img
                      src="/imagenes/Microsoft_icon.svg.png"
                      alt="Iniciar sesión con Microsoft"
                      className="h-6 mr-2"
                    />
                    <span>Iniciar sesión</span>
                  </div>
                )}
              </button>

              {errorMessage && (
                <div className="mt-4 text-sm text-red-600 text-center">
                  {errorMessage}
                </div>
              )}
              {loadingMessage && !errorMessage && (
                <div className="mt-4 text-sm text-blue-600 text-center">
                  {loadingMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
