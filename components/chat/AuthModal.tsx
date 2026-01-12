import React, { FormEvent } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface AuthModalProps {
  show: boolean;
  authMode: "login" | "signup";
  authError: string;
  authLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
  onGoogleSuccess: (response: CredentialResponse) => void;
  onGoogleError: () => void;
  onAppleClick: () => void;
  canResendConfirmation: boolean;
  onResendConfirmation: () => void;
}

export default function AuthModal({
  show,
  authMode,
  authError,
  authLoading,
  onSubmit,
  onToggleMode,
  onGoogleSuccess,
  onGoogleError,
  onAppleClick,
  canResendConfirmation,
  onResendConfirmation,
}: AuthModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-2xl shadow-2xl border border-[#2A2A2A]">
        <div className="p-8">
          <h1 className="text-3xl font-semibold text-center mb-2 text-white">
            {authMode === "login" ? "Labadain LIX-R361" : "Kria konta iha LIX-R361"}
          </h1>
          <p className="text-center text-gray-400 mb-8">
            {authMode === "login" ? "Login hodi bele asesu" : "Kria konta foun ida ba asesu"}
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <input
                  name="name"
                  type="text"
                  placeholder="Naran Kompletu"
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all"
                />
              </div>
            )}
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all"
                required
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-4 py-3 bg-[#20B8CD] hover:bg-[#1BA5BA] text-white font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#20B8CD] focus:ring-offset-2 focus:ring-offset-[#1A1A1A] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading && (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {authMode === "signup"
                ? authLoading
                  ? "Kria hela konta..."
                  : "Kria Konta"
                : authLoading
                  ? "Login..."
                  : "Login"}
            </button>
          </form>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px bg-[#2A2A2A] flex-1" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">or</span>
            <div className="h-px bg-[#2A2A2A] flex-1" />
          </div>
          <div className="mt-4 flex flex-col gap-3 items-center">
            <div className="w-[260px] flex justify-center">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={onGoogleError}
                shape="pill"
                text={authMode === "login" ? "continue_with" : "signup_with"}
                width="260"
              />
            </div>
            <div className="w-[260px] flex justify-center">
              <button
                type="button"
                onClick={onAppleClick}
                className="w-full h-10 bg-white text-black font-medium rounded-full inline-flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-[#1A1A1A]"
              >
                <span className="text-lg"></span>
                <span>{authMode === "login" ? "Sign in with Apple" : "Sign up with Apple"}</span>
              </button>
            </div>
          </div>
          {authError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-xl">
              <span className="text-red-400 text-sm">{authError}</span>
            </div>
          )}
          {canResendConfirmation && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={onResendConfirmation}
                className="text-xs text-[#20B8CD] hover:text-[#1BA5BA] underline underline-offset-4"
                disabled={authLoading}
             >
                Seidauk simu email konfirmasaun? Haruka fali link foun ida.
              </button>
            </div>
          )}
          <p className="text-center text-sm mt-6 text-gray-400">
            {authMode === "login" ? "Seidauk iha konta? " : "Konta iha tiha ona? "}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-[#20B8CD] hover:text-[#1BA5BA] transition-colors"
            >
              {authMode === "login" ? "Kria Konta" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
