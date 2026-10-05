import {
    Navigate,
    Outlet,
} from "react-router-dom";

import LoadingState from "./LoadingState";

import { useAuth } from "../context/AuthContext";


interface RoleRouteProps {
    allowedRoles: string[];
}


export default function RoleRoute({
    allowedRoles,
}: RoleRouteProps) {
    const {
        user,
        loading,
    } = useAuth();

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

    if (!allowedRoles.includes(user.role)) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Outlet />;
}