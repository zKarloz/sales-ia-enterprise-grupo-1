export interface AuthUser {
    id: number;
    role_id: number;
    role: string;
    full_name: string;
    email: string;
}


export interface LoginRequest {
    email: string;
    password: string;
}


export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: AuthUser;
}