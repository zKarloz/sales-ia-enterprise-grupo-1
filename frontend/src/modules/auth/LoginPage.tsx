import {
    useState,
    type FormEvent,
} from "react";

import {
    Navigate,
    useNavigate,
} from "react-router-dom";

import Button from "../../components/Button";
import ErrorState from "../../components/ErrorState";

import { useAuth } from "../../context/AuthContext";


export default function LoginPage() {
    const {
        user,
        login,
    } = useAuth();

    const navigate = useNavigate();

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const [
        loading,
        setLoading,
    ] = useState(false);


    if (user) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setLoading(true);
            setError(null);

            await login(
                email.trim(),
                password,
            );

            navigate(
                "/",
                {
                    replace: true,
                },
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "No se pudo iniciar sesión.",
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <main
            className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-slate-50
        px-4
        py-10
        transition-colors
        dark:bg-slate-950
        sm:px-6
      "
        >
            <div
                aria-hidden="true"
                className="
          pointer-events-none
          absolute
          -left-32
          top-0
          h-96
          w-96
          rounded-full
          bg-cyan-300/20
          blur-3xl
          dark:bg-cyan-500/10
        "
            />

            <div
                aria-hidden="true"
                className="
          pointer-events-none
          absolute
          -right-24
          bottom-0
          h-80
          w-80
          rounded-full
          bg-blue-300/20
          blur-3xl
          dark:bg-blue-500/10
        "
            />

            <section
                className="
          relative
          z-10
          grid
          w-full
          max-w-5xl
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          shadow-slate-950/10
          transition-colors
          dark:border-slate-800
          dark:bg-slate-900
          dark:shadow-black/30
          lg:grid-cols-[1.05fr_1fr]
        "
            >
                <div
                    className="
            hidden
            flex-col
            justify-between
            bg-[#081b31]
            p-10
            text-white
            lg:flex
          "
                >
                    <div>
                        <div
                            className="
                mb-8
                grid
                h-12
                w-12
                place-items-center
                rounded-2xl
                bg-cyan-400
                text-xl
                font-black
                text-slate-950
                shadow-lg
                shadow-cyan-950/30
              "
                        >
                            S
                        </div>

                        <p
                            className="
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-cyan-300
              "
                        >
                            SalesIA Enterprise
                        </p>

                        <h1
                            className="
                mt-4
                max-w-md
                text-4xl
                font-bold
                tracking-tight
              "
                        >
                            Gestión comercial con analítica integrada
                        </h1>

                        <p
                            className="
                mt-5
                max-w-md
                text-sm
                leading-7
                text-slate-300
              "
                        >
                            Centraliza ventas, clientes, productos,
                            inventario e indicadores empresariales
                            desde una única plataforma.
                        </p>
                    </div>

                    <div
                        className="
              border-t
              border-white/10
              pt-6
              text-xs
              leading-6
              text-slate-400
            "
                    >
                        <p>
                            Plataforma empresarial • React + FastAPI
                        </p>

                        <p>
                            Acceso protegido mediante roles y permisos.
                        </p>
                    </div>
                </div>

                <div
                    className="
            flex
            items-center
            px-6
            py-10
            sm:px-10
            lg:px-12
          "
                >
                    <div className="w-full">
                        <div className="mb-8">
                            <div
                                className="
                  mb-6
                  grid
                  h-11
                  w-11
                  place-items-center
                  rounded-xl
                  bg-cyan-400
                  text-lg
                  font-black
                  text-slate-950
                  lg:hidden
                "
                            >
                                S
                            </div>

                            <p
                                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-cyan-700
                  dark:text-cyan-400
                "
                            >
                                Acceso empresarial
                            </p>

                            <h2
                                className="
                  mt-2
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  dark:text-white
                "
                            >
                                Iniciar sesión
                            </h2>

                            <p
                                className="
                  mt-3
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
                            >
                                Ingresa tus credenciales para acceder
                                al panel de SalesIA Enterprise.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6">
                                <ErrorState message={error} />
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="email"
                                    className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-200
                  "
                                >
                                    Correo electrónico
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="usuario@empresa.com"
                                    required
                                    disabled={loading}
                                    className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-3.5
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-cyan-500
                    focus:ring-4
                    focus:ring-cyan-500/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-slate-100
                    dark:placeholder:text-slate-600
                  "
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-200
                  "
                                >
                                    Contraseña
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                    disabled={loading}
                                    className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-3.5
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-cyan-500
                    focus:ring-4
                    focus:ring-cyan-500/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-slate-100
                    dark:placeholder:text-slate-600
                  "
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading
                                    ? "Ingresando..."
                                    : "Iniciar sesión"}
                            </Button>
                        </form>

                        <p
                            className="
                mt-7
                text-center
                text-xs
                leading-5
                text-slate-400
                dark:text-slate-500
              "
                        >
                            El acceso está sujeto a los permisos
                            asignados a tu rol.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}