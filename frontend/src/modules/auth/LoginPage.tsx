import { useState } from "react";

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

    const [email, setEmail] = useState("");
    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);


    if (user) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setLoading(true);
            setError(null);

            await login(
                email.trim(),
                password,
            );

            navigate("/", {
                replace: true,
            });
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
        <main className="login-page">
            <section className="form-card">
                <div className="form-card__header">
                    <span>SalesIA Enterprise</span>

                    <h1>Iniciar sesión</h1>

                    <p>
                        Ingresa tus credenciales para acceder
                        al panel empresarial.
                    </p>
                </div>

                {error && (
                    <ErrorState message={error} />
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="email">
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
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">
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
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Ingresando..."
                                : "Iniciar sesión"}
                        </Button>
                    </div>
                </form>
            </section>
        </main>
    );
}