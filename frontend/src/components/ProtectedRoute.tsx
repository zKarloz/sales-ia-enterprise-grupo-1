import {
    Navigate,
    Outlet,
} from "react-router-dom";

import LoadingState from "./LoadingState";

import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingState />;
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return <Outlet />;
}