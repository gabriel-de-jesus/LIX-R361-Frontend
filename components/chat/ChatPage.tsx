import React, { useState, useRef, useEffect, FormEvent } from "react";
import type { CredentialResponse } from '@react-oauth/google';
import { Message, User, Chat } from "./types";
import ChatHeader from "./ChatHeader";
import ChatSidebar, { SidebarContent } from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import AuthModal from "./AuthModal";

export default function ChatPage() {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const [pendingLogout, setPendingLogout] = useState(false);
  const [pendingAccountDelete, setPendingAccountDelete] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [lastAuthEmail, setLastAuthEmail] = useState<string | null>(null);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null);
  const [pendingNameChange, setPendingNameChange] = useState<string | null>(null);
  const [accountDeleteSuccess, setAccountDeleteSuccess] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showIosAppPopup, setShowIosAppPopup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("labadain_user");
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  // Show a one-time popup announcing the iOS app.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem("labadain_ios_app_popup_dismissed");
    if (!dismissed) {
      setShowIosAppPopup(true);
    }
  }, []);

  // Fetch chats for the user
  const fetchChats = async () => {
    if (!user) {
      setChatHistory([]);
      setMessages([]);
      setCurrentChatId(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/chats?user_id=${user.id}`);
      if (!res.ok) throw new Error("Failed to load chats");
      const data = await res.json();
      setChatHistory(data.chats || []);
      setMessages([]);
      setCurrentChatId(null);
    } catch (err) {
      console.error(err);
      setChatHistory([]);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, API_BASE]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const dismissIosAppPopup = () => {
    setShowIosAppPopup(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("labadain_ios_app_popup_dismissed", "1");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const credential = credentialResponse.credential;
      if (!credential) {
        setAuthError("Google authentication failed: missing credential.");
        return;
      }

      const [, payloadBase64] = credential.split(".");
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);

      const email = payload.email as string | undefined;
      const name = (payload.name as string | undefined) || (email ? email.split("@")[0] : undefined);
      const image = payload.picture as string | undefined;
      const providerId = payload.sub as string | undefined;

      if (!email || !name) {
        setAuthError("Google authentication did not return a valid email.");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, image, provider_id: providerId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Google authentication failed");
      }

      const authUser = await res.json();
      const extendedUser: User = { ...authUser, provider: "google" };
      localStorage.setItem("labadain_user", JSON.stringify(extendedUser));
      setUser(extendedUser);
      setShowAuth(false);
      setAuthError("");

      if (pendingSuggestion) {
        const textToSend = pendingSuggestion;
        setPendingSuggestion(null);
        await sendMessage(textToSend);
      }
    } catch (err) {
      setAuthError((err as Error).message);
    }
  };

  const handleAppleClick = async () => {
    setAuthError("");

    if (typeof window === "undefined") {
      setAuthError("Login ho Apple la disponível.");
      return;
    }

    const AppleID = (window as any).AppleID;

    if (!AppleID || !AppleID.auth) {
      setAuthError("Login ho Apple la karrega ho loloos. Favór atualiza pájina.");
      return;
    }

    const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const appleRedirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

    if (!appleClientId || !appleRedirectURI) {
      setAuthError("Login ho Apple seidauk konfigura (client ID/redirect URL falta).");
      return;
    }

    try {
      AppleID.auth.init({
        clientId: appleClientId,
        redirectURI: appleRedirectURI,
        scope: "name email",
        usePopup: true,
      });

      const response = await AppleID.auth.signIn();
      // Debug: inspect raw Apple sign-in response
      console.log("[Apple SignIn] raw response", response);
      const idToken: string | undefined = response?.authorization?.id_token;

      if (!idToken) {
        setAuthError("Login ho Apple la hetan token.");
        return;
      }

      const [, payloadBase64] = idToken.split(".");
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);

      // Debug: inspect decoded ID token payload
      console.log("[Apple SignIn] id_token payload", payload);

      const email: string | undefined = payload.email || response?.user?.email;
      const nameFromPayload: string | undefined = payload.name;
      const nameFromUser: string | undefined = response?.user?.name
        ? `${response.user.name.firstName || ""} ${response.user.name.lastName || ""}`.trim()
        : undefined;
      const name: string | undefined = nameFromPayload || nameFromUser || (email ? email.split("@")[0] : undefined);
      const providerId: string | undefined = payload.sub;

      // Debug: inspect derived identity fields
      console.log("[Apple SignIn] derived fields", { email, name, providerId });

      if (!email || !name) {
        setAuthError("Autentikasaun ho Apple la hetan email ne'ebe validu.");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, image: null, provider_id: providerId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Autentikasaun ho Apple la susesu.");
      }

      const authUser = await res.json();
      const extendedUser: User = { ...authUser, provider: "apple" };
      localStorage.setItem("labadain_user", JSON.stringify(extendedUser));
      setUser(extendedUser);
      setShowAuth(false);
      setAuthError("");

      if (pendingSuggestion) {
        const textToSend = pendingSuggestion;
        setPendingSuggestion(null);
        await sendMessage(textToSend);
      }
    } catch (err) {
      setAuthError((err as Error).message || "Autentikasaun ho Apple la susesu.");
    }
  };

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const formData = new FormData(e.currentTarget);
    const userData = {
      email: formData.get("email") as string,
      name: (formData.get("name") as string) || (formData.get("email") as string).split("@")[0],
      password: formData.get("password") as string,
    };
    const endpoint = authMode === "signup" ? "signup" : "login";

    // Remember the last email used for auth so we can
    // offer a "resend confirmation" action when needed.
    setLastAuthEmail(userData.email);

    try {
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // If the account exists but is not yet confirmed, show a
        // clear message and allow resending the confirmation email.
        if (
          res.status === 403 &&
          body.detail &&
          typeof body.detail === "string" &&
          body.detail.includes("konfirma ita-nia email")
        ) {
          setAuthError(body.detail);
          setCanResendConfirmation(true);
          return;
        }

        throw new Error(body.detail || "Authentication failed");
      }

      const authUser = await res.json();
      if (endpoint === "signup") {
        // Do not log the user in automatically; require email confirmation first.
        // Switch back to login mode and show a clear message.
        setAuthMode("login");
        setAuthError(
          "Ita-nia konta kria tiha ona ho susesu. Favór hare ita-nia email atu konfirma hodi bele halo login."
        );
         setCanResendConfirmation(true);
      } else {
        const extendedUser: User = { ...authUser, provider: "email" };
        localStorage.setItem("labadain_user", JSON.stringify(extendedUser));
        setUser(extendedUser);
        setShowAuth(false);
        setCanResendConfirmation(false);

        if (pendingSuggestion) {
          const textToSend = pendingSuggestion;
          setPendingSuggestion(null);
          await sendMessage(textToSend);
        }
      }
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!lastAuthEmail) {
      setAuthError("Favór tau email iha formuláriu login ka signup lai.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_BASE}/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lastAuthEmail }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || "La konsege haruka fali email konfirmasaun nian.");
      }

      setAuthError(
        (body.message as string) ||
        "Link konfirmasaun foun haruka tiha ona ba ita-nia email. Favór hare ita-nia inbox (nomós iha spam/junk folder)."
      );
      setCanResendConfirmation(true);
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("labadain_user");
    setMessages([]);
    setCurrentChatId(null);
    setChatHistory([]);
    setSelectedTools([]);
  };

  const requestLogout = () => {
    setPendingLogout(true);
  };

  const handleEditProfile = () => {
    if (!user) return;
    const currentName = user.name || "";
    const newName = window.prompt("Troka ita-nia naran", currentName);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === currentName) return;

    setPendingNameChange(trimmed);
  };

  const performNameUpdate = async () => {
    if (!user || !pendingNameChange) return;

    if (!user.token) {
      setAuthError("La hetan token atu atualiza profil. Favór halo login fali.");
      setPendingNameChange(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, token: user.token, name: pendingNameChange }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body.detail as string) || "La konsege atualiza profil.");
      }

      const updatedUser = await res.json();
      localStorage.setItem("labadain_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAuthError("");
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setPendingNameChange(null);
    }
  };

  const performDeleteAccount = async () => {
    if (!user) return;
    if (!user.token) {
      setAuthError("La hetan token atu apaga konta. Favór halo login fali.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, token: user.token }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body.detail as string) || "La konsege apaga konta.");
      }

      // On success, log the user out locally
      handleLogout();
      setAuthError("");
      setAccountDeleteSuccess(true);
    } catch (err) {
      setAuthError((err as Error).message);
    }
  };

  const requestDeleteAccount = () => {
    setPendingAccountDelete(true);
  };

  const saveChat = async (msgs: Message[]) => {
    if (msgs.length === 0 || !user) return;

    try {
      const res = await fetch(`${API_BASE}/chats/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, chat_id: currentChatId, messages: msgs }),
      });

      if (!res.ok) throw new Error("Failed to save chat");
      const body = await res.json();
      const chatId = body.chat_id;
      const updatedAt = body.updated_at;
      const savedMessages: Message[] = body.messages || msgs;

      const updated = [...chatHistory];
      const idx = currentChatId ? updated.findIndex(c => c.id === currentChatId) : -1;
      
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], messages: savedMessages, updatedAt };
      } else {
        const newChat: Chat = {
          id: chatId,
          title: savedMessages[0]?.content.slice(0, 40) || "New Chat",
          messages: savedMessages,
          createdAt: updatedAt,
          updatedAt,
        };
        updated.unshift(newChat);
        setCurrentChatId(chatId);
      }

      setChatHistory(updated);
      // Ensure current messages state carries DB-backed IDs too
      setMessages(savedMessages);
    } catch (err) {
      console.error(err);
    }
  };

  const loadChat = (id: string | number) => {
    const chat = chatHistory.find(c => c.id === id);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(id);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSelectedTools([]);
  };

  const requestDeleteChat = (id: string | number) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteChat = async () => {
    if (!user || pendingDeleteId === null) return;
    try {
      const res = await fetch(`${API_BASE}/chats/${pendingDeleteId}?user_id=${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat");
      const updated = chatHistory.filter(c => c.id !== pendingDeleteId);
      setChatHistory(updated);
      if (currentChatId === pendingDeleteId) startNewChat();
    } catch (err) {
      console.error(err);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const cancelDeleteChat = () => {
    setPendingDeleteId(null);
  };

  async function sendMessage(text: string, file?: File | null) {
    const userMsg: Message = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    const idx = newMsgs.length;
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("input_text", text);
        formData.append("file", file);
        formData.append("messages", JSON.stringify(messages));
        formData.append("force_search", selectedTools.includes("Peskiza Web") ? "true" : "false");
        res = await fetch(`${API_BASE}/chat/upload`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        // Streaming for file uploads
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let content = "";
        let buffer = "";
        let streamEnded = false;

        while (!streamEnded) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (true) {
            const idxLF = buffer.indexOf("\n\n");
            const idxCRLF = buffer.indexOf("\r\n\r\n");

            let eventEndIndex = -1;
            let delimiterLength = 0;

            if (idxLF !== -1 && (idxCRLF === -1 || idxLF < idxCRLF)) {
              eventEndIndex = idxLF;
              delimiterLength = 2;
            } else if (idxCRLF !== -1) {
              eventEndIndex = idxCRLF;
              delimiterLength = 4;
            }

            if (eventEndIndex === -1) break;

            const rawEvent = buffer.slice(0, eventEndIndex);
            buffer = buffer.slice(eventEndIndex + delimiterLength);

            const lines = rawEvent.split(/\r?\n/);
            let eventType: string | null = null;
            const dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataLines.push(line.slice(6));
              }
            }

            const data = dataLines.join("\n");

            if (eventType === "end") {
              streamEnded = true;
              break;
            }

            if (data && data !== "[DONE]") {
              // Typewriter-style reveal: append characters one by one
              for (const ch of data) {
                content += ch;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[idx] = { role: "assistant" as const, content, streaming: true };
                  return updated;
                });
                // Small delay to mimic natural typing (faster)
                // eslint-disable-next-line no-await-in-loop
                await new Promise(resolve => setTimeout(resolve, 15));
              }
            }
          }
        }

        const final = [...newMsgs, { role: "assistant" as const, content, streaming: false }];
        setMessages(final);
        await saveChat(final);
      } else {
        // Streaming for normal text
        res = await fetch(`${API_BASE}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMsgs,
            force_search: selectedTools.includes("Peskiza Web"),
          }),
          signal: controller.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let content = "";
        let buffer = "";
        let streamEnded = false;

        while (!streamEnded) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (true) {
            const idxLF = buffer.indexOf("\n\n");
            const idxCRLF = buffer.indexOf("\r\n\r\n");

            let eventEndIndex = -1;
            let delimiterLength = 0;

            if (idxLF !== -1 && (idxCRLF === -1 || idxLF < idxCRLF)) {
              eventEndIndex = idxLF;
              delimiterLength = 2;
            } else if (idxCRLF !== -1) {
              eventEndIndex = idxCRLF;
              delimiterLength = 4;
            }

            if (eventEndIndex === -1) break;

            const rawEvent = buffer.slice(0, eventEndIndex);
            buffer = buffer.slice(eventEndIndex + delimiterLength);

            const lines = rawEvent.split(/\r?\n/);
            let eventType: string | null = null;
            const dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataLines.push(line.slice(6));
              }
            }

            const data = dataLines.join("\n");

            if (eventType === "end") {
              streamEnded = true;
              break;
            }

            if (data && data !== "[DONE]") {
              for (const ch of data) {
                content += ch;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[idx] = { role: "assistant" as const, content, streaming: true };
                  return updated;
                });
                // Slightly faster typewriter for normal text
                // eslint-disable-next-line no-await-in-loop
                await new Promise(resolve => setTimeout(resolve, 15));
              }
            }
          }
        }

        const final = [...newMsgs, { role: "assistant" as const, content, streaming: false }];
        setMessages(final);
        await saveChat(final);
      }
    } catch (error) {
      if ((error as any)?.name === "AbortError") {
        // Mark the streaming message as finished but keep whatever content arrived
        setMessages(prev => {
          const updated = [...prev];
          if (updated[idx]) {
            updated[idx] = { ...(updated[idx] as any), streaming: false };
          }
          return updated;
        });
      } else {
        console.error(error);
        setMessages(prev => prev.filter((_, i) => i !== idx));
      }
    } finally {
      setAbortController(null);
      setLoading(false);
    }
  }

  // Accept file argument for handleSubmit
  async function handleSubmit(e: FormEvent<HTMLFormElement>, file?: File | null) {
    e.preventDefault();
    if (!input.trim() && !file) return;
    if (!user) {
      setShowAuth(true);
      return;
    }
    await sendMessage(input, file);
  }

  const handleCancelGeneration = () => {
    if (!loading || !abortController) return;
    abortController.abort();
  };

  return (
    <div className="relative flex h-screen bg-[#0D0D0D]">

      {/* One-time popup announcing the iOS app */}
      {showIosAppPopup && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={dismissIosAppPopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-white rounded-full p-1 hover:bg-[#2A2A2A] transition-colors"
              aria-label="Taka avizu iOS"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src="/ai-avatar.png"
                alt="Labadain LIX-R361"
                className="w-8 h-8 rounded-full shadow-sm"
              />
              <h2 className="text-xl font-semibold text-white">Labadain LIX-R361</h2>
            </div>
            <p className="text-sm text-gray-300 mb-4 text-center">
              Labadain iha iOS ona no agora ita bele instala no uza iha iPhone.
              Download aplikasaun LIX-R361 hosi App Store.
            </p>
            <a
              href="https://apps.apple.com/mn/app/labadain-chat/id6757595339"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 text-center text-sm font-medium rounded-xl bg-white text-black hover:bg-gray-100 transition-colors mb-2"
            >
              Loke iha App Store
            </a>
            <button
              type="button"
              onClick={dismissIosAppPopup}
              className="w-full px-4 py-2 text-sm rounded-xl bg-[#0D0D0D] text-gray-200 hover:bg-[#232323] transition-colors"
            >
              Taka
            </button>
          </div>
        </div>
      )}

      {/* Global confirmation dialog for chat deletion (overlays both mobile and desktop) */}
      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
            <p className="text-sm text-gray-300 mb-4">
              Ita-boot hakarak apaga tiha konversa ida-ne'e?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDeleteChat}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
              >
                Lae
              </button>
              <button
                type="button"
                onClick={confirmDeleteChat}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#20B8CD] hover:bg-[#1BA5BA] transition-colors"
              >
                Apaga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar: full or compact */}
      {isDesktopSidebarOpen ? (
        <div className="hidden lg:flex lg:flex-col w-72 bg-[#0D0D0D] border-r border-[#2A2A2A] z-20 relative h-full">
          <div className="pt-6 pb-2 px-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200">Labadain Timor-Leste</span>
            <div className="relative ml-4 group">
              <button
                type="button"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
                onClick={() => setIsDesktopSidebarOpen(false)}
                aria-label="Minimiza"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path d="M15.75 19.5L9.25 12l6.5-7.5" />
                </svg>
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#1A1A1A] text-[11px] text-gray-200 border border-[#2A2A2A] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all whitespace-nowrap">
                Minimiza
              </span>
            </div>
          </div>
          <SidebarContent
            chatHistory={chatHistory}
            currentChatId={currentChatId}
            user={user}
            onStartNewChat={startNewChat}
            onLoadChat={loadChat}
            onDeleteChat={requestDeleteChat}
            onLogout={requestLogout}
            onEditProfile={handleEditProfile}
            onDeleteAccount={requestDeleteAccount}
            onShowAuth={() => setShowAuth(true)}
            newChatLabel="Konversa Foun"
            authButtonLabel={user ? "Logout" : "Login"}
            chatListClassName="flex-1 overflow-y-auto px-2"
            userSectionClassName="p-3"
          />
        </div>
      ) : (
        // Compact sidebar with icons only
        <div className="hidden lg:flex flex-col w-20 bg-[#0D0D0D] border-r border-[#2A2A2A] z-20 h-full items-center py-4">
          <div className="flex flex-col items-center space-y-4 flex-1 w-full">
            <button
              type="button"
              className="p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
              onClick={() => setIsDesktopSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="relative group">
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#232323] text-[#20B8CD] hover:text-white hover:bg-[#232323] transition-colors"
                onClick={startNewChat}
                aria-label="New chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <line x1="10" y1="4" x2="10" y2="16" />
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
              </button>
              <span className="pointer-events-none absolute top-full left-0 ml-0.5 mt-1 px-1 rounded bg-[#1A1A1A] text-[11px] text-gray-200 border border-[#2A2A2A] opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all whitespace-nowrap">
                Konversa Foun
              </span>
            </div>
            {/* Labadain products */}
            <div className="flex flex-col items-center space-y-3 mt-2">
              <div className="relative group">
                <a
                  href="https://old.labadain.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
                  aria-label="Labadain R361"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M5.5 5.25h13a1.25 1.25 0 011.25 1.25v7a1.25 1.25 0 01-1.25 1.25H12l-3.5 3.25V14.75H5.5A1.25 1.25 0 014.25 13.5v-7A1.25 1.25 0 015.5 5.25z" />
                  </svg>
                  <span className="text-[11px] text-gray-400 text-center">Labadain R361</span>
                </a>
              </div>
              <div className="relative group">
                <a
                  href="https://search.labadain.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
                  aria-label="Labadain Search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    {/* External link icon for search engine */}
                    <path d="M9.75 5.75h-3a1 1 0 00-1 1v11.5a1 1 0 001 1h11.5a1 1 0 001-1v-3" />
                    <path d="M14 5h5v5" />
                    <path d="M14 10L19 5" />
                  </svg>
                  <span className="text-[11px] text-gray-400 text-center">Labadain Search</span>
                </a>
              </div>
              <div className="relative group">
                <a
                  href="https://www.timornews.tl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
                  aria-label="Timor News"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <rect x="4" y="5" width="9.5" height="14" rx="1.5" />
                    <path d="M17 7h2.25A1.75 1.75 0 0121 8.75V17a2 2 0 01-2 2H13.5" />
                    <path d="M6.5 8.5h4.5" />
                    <path d="M6.5 11h4.5" />
                    <path d="M6.5 13.5H10" />
                  </svg>
                  <span className="text-[11px] text-gray-400 text-center">Timor News</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center w-full pb-4">
            <div className="relative group">
              <button
                type="button"
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
                onClick={user ? requestLogout : () => setShowAuth(true)}
                aria-label={user ? "Logout" : "Login"}
              >
                {user ? (
                  user.avatar_url ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA]">
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] text-white font-semibold text-base">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9A3.75 3.75 0 1112 5.25 3.75 3.75 0 0115.75 9zm-7.5 9a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V18z" />
                    </svg>
                  </span>
                )}
                <span className="text-[11px] text-gray-400 text-center">
                  {user ? "Logout" : "Login"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar (unchanged) */}
      <ChatSidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        user={user}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onStartNewChat={startNewChat}
        onLoadChat={loadChat}
        onDeleteChat={requestDeleteChat}
        onLogout={requestLogout}
        onEditProfile={handleEditProfile}
        onDeleteAccount={requestDeleteAccount}
        onShowAuth={() => setShowAuth(true)}
        onCloseMobileSidebar={() => {
          setIsMobileSidebarOpen(false);
          setPendingDeleteId(null);
        }}
      />

        {pendingAccountDelete && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
              <p className="text-sm text-gray-300 mb-4">
                Ita-boot hakarak apaga tiha ita-nia konta Labadain? Operasaun ida-ne'e labele anula fali.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingAccountDelete(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
                >
                  Lae
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await performDeleteAccount();
                    setPendingAccountDelete(false);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Apaga
                </button>
              </div>
            </div>
          </div>
        )}

        {accountDeleteSuccess && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
              <p className="text-sm text-gray-300 mb-4">
                Ita-nia konta apaga tiha ona ho susesu.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAccountDeleteSuccess(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#20B8CD] hover:bg-[#1BA5BA] transition-colors"
               >
                  Di'ak
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingNameChange && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
              <p className="text-sm text-gray-300 mb-4">
                Ita-boot hakarak troka ita-nia naran ba "{pendingNameChange}"?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingNameChange(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
                >
                  Lae
                </button>
                <button
                  type="button"
                  onClick={performNameUpdate}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#20B8CD] hover:bg-[#1BA5BA] transition-colors"
                >
                  Loos
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingLogout && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
              <p className="text-sm text-gray-300 mb-4">
                Ita-boot hakarak sai hosi Labadain LIX-R361?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingLogout(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
                >
                  Lae
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setPendingLogout(false);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#20B8CD] hover:bg-[#1BA5BA] transition-colors"
                >
                  Loos
                </button>
              </div>
            </div>
          </div>
        )}

      <div className={`flex flex-col flex-1 ${!isDesktopSidebarOpen ? 'lg:ml-16' : ''}`}> 
        <ChatHeader onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <ChatMessages
          messages={messages}
          user={user}
          input={input}
          loading={loading}
          messagesEndRef={messagesEndRef}
          onChangeInput={setInput}
          onSubmit={handleSubmit}
          onCancel={handleCancelGeneration}
          onToolsChange={setSelectedTools}
        />
      </div>

      <AuthModal
        show={showAuth}
        authMode={authMode}
        authError={authError}
        authLoading={authLoading}
        onSubmit={handleAuth}
        onToggleMode={() => {
          setAuthMode(authMode === "login" ? "signup" : "login");
          setCanResendConfirmation(false);
          setAuthError("");
        }}
        canResendConfirmation={canResendConfirmation}
        onResendConfirmation={handleResendConfirmation}
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={() => setAuthError("Google authentication failed.")}
        onAppleClick={handleAppleClick}
      />
    </div>
  );
}
