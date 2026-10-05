import { apiRequest } from "./api";

import type {
    AuthUser,
    LoginRequest,
    LoginResponse,
} from "../types/auth";


export async function login(
    credentials: LoginRequest,
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>(
        "/api/auth/login",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        },
    );
}


export async function getCurrentUser(): Promise<AuthUser> {
    return apiRequest<AuthUser>(
        "/api/auth/me",
    );
}