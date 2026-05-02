"use client";
import { logout } from "@/app/auth-actions";

export function LogoutButton() {
    return (
        <button className="btn" type="button" onClick={() => void logout()}>
            Logout
        </button>
    );
}