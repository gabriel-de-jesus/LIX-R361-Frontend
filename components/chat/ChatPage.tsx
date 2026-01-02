import React, { useState, useRef, useEffect, FormEvent } from "react";
import type { CredentialResponse } from '@react-oauth/google';
import { Message, User, Chat } from "./types";
import ChatHeader from "./ChatHeader";
import ChatSidebar, { SidebarContent } from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import AuthModal from "./AuthModal";

export default function ChatPage() {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("labadain_user");
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setChatHistory([]);
      setMessages([]);
      setCurrentChatId(null);
      return;
    }

    const fetchChats = async () => {
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

    fetchChats();
  }, [user, API_BASE]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      localStorage.setItem("labadain_user", JSON.stringify(authUser));
      setUser(authUser);
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

    try {
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
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
      } else {
        localStorage.setItem("labadain_user", JSON.stringify(authUser));
        setUser(authUser);
        setShowAuth(false);

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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("labadain_user");
    setMessages([]);
    setCurrentChatId(null);
    setChatHistory([]);
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

      const updated = [...chatHistory];
      const idx = currentChatId ? updated.findIndex(c => c.id === currentChatId) : -1;
      
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], messages: msgs, updatedAt };
      } else {
        const newChat: Chat = {
          id: chatId,
          title: msgs[0]?.content.slice(0, 40) || "New Chat",
          messages: msgs,
          createdAt: updatedAt,
          updatedAt,
        };
        updated.unshift(newChat);
        setCurrentChatId(chatId);
      }

      setChatHistory(updated);
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

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("input_text", text);
        formData.append("file", file);
        formData.append("messages", JSON.stringify(messages));
        res = await fetch(`${API_BASE}/copilot/chat/upload`, {
          method: "POST",
          body: formData,
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
              content += data;
              setMessages(prev => {
                const updated = [...prev];
                updated[idx] = { role: "assistant" as const, content, streaming: true };
                return updated;
              });
            }
          }
        }

        const final = [...newMsgs, { role: "assistant" as const, content, streaming: false }];
        setMessages(final);
        await saveChat(final);
      } else {
        // Streaming for normal text
        res = await fetch(`${API_BASE}/copilot/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMsgs }),
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
              content += data;
              setMessages(prev => {
                const updated = [...prev];
                updated[idx] = { role: "assistant" as const, content, streaming: true };
                return updated;
              });
            }
          }
        }

        const final = [...newMsgs, { role: "assistant" as const, content, streaming: false }];
        setMessages(final);
        await saveChat(final);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter((_, i) => i !== idx));
    } finally {
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

  return (
    <div className="relative flex h-screen bg-[#0D0D0D]">

      {/* Desktop Sidebar: full or compact */}
      {isDesktopSidebarOpen ? (
        <div className="hidden lg:flex lg:flex-col w-72 bg-[#0D0D0D] border-r border-[#2A2A2A] z-20 relative h-full">
          <div className="pt-6 pb-2 px-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200">Istóriku Konversa Sira</span>
            <button
              type="button"
              className="ml-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
              onClick={() => setIsDesktopSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent
            chatHistory={chatHistory}
            currentChatId={currentChatId}
            user={user}
            onStartNewChat={startNewChat}
            onLoadChat={loadChat}
            onDeleteChat={requestDeleteChat}
            onLogout={handleLogout}
            onShowAuth={() => setShowAuth(true)}
            newChatLabel="Konversa Foun"
            authButtonLabel={user ? "Logout" : "Login"}
            chatListClassName="flex-1 overflow-y-auto px-2"
            userSectionClassName="p-3"
          />
          {pendingDeleteId !== null && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
              <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
                <p className="text-sm text-gray-300 mb-4">
                  Ita-boot hakarak hamoos tiha konversa ida-ne'e?
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
                    Loos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Compact sidebar with icons only
        <div className="hidden lg:flex flex-col w-16 bg-[#0D0D0D] border-r border-[#2A2A2A] z-20 h-full items-center py-4">
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
            <button
              type="button"
              className="p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
              onClick={startNewChat}
              aria-label="New chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col items-center w-full pb-4">
            <button
              type="button"
              className="p-2 rounded-lg text-gray-300 hover:bg-[#232323] hover:text-white transition-colors"
              onClick={user ? handleLogout : () => setShowAuth(true)}
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
            </button>
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
        onLogout={handleLogout}
        onShowAuth={() => setShowAuth(true)}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <div className={`flex flex-col flex-1 ${!isDesktopSidebarOpen ? 'lg:ml-12' : ''}`}> 
        <ChatHeader onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <ChatMessages
          messages={messages}
          user={user}
          input={input}
          loading={loading}
          messagesEndRef={messagesEndRef}
          onChangeInput={setInput}
          onSubmit={handleSubmit}
        />
      </div>

      <AuthModal
        show={showAuth}
        authMode={authMode}
        authError={authError}
        authLoading={authLoading}
        onSubmit={handleAuth}
        onToggleMode={() => setAuthMode(authMode === "login" ? "signup" : "login")}
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={() => setAuthError("Google authentication failed.")}
      />
    </div>
  );
}
