import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    clearAccessToken,
    getAccessToken,
    setAccessToken,
} from "../services/api";

import {
    getCurrentUser,
    login as loginRequest,
} from "../services/authService";

import type { AuthUser } from "../types/auth";


interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (
        email: string,
        password: string,
    ) => Promise<void>;
    logout: () => void;
}


const AuthContext =
    createContext<AuthContextValue | null>(null);


export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [loading, setLoading] =
        useState(true);


    useEffect(() => {
        async function restoreSession() {
            const token = getAccessToken();

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Verifica que el JWT siga siendo válido.
                const currentUser =
                    await getCurrentUser();

                setUser(currentUser);
            } catch {
                clearAccessToken();
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        restoreSession();
    }, []);


    async function login(
        email: string,
        password: string,
    ) {
        const response = await loginRequest({
            email,
            password,
        });

        setAccessToken(response.access_token);
        setUser(response.user);
    }


    function logout() {
        clearAccessToken();
        setUser(null);
    }


    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider.",
        );
    }

    return context;
}