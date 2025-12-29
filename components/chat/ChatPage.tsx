import React, { useState, useRef, useEffect, FormEvent } from "react";
import type { CredentialResponse } from '@react-oauth/google';
import { Message, User, Chat } from "./types";
import ChatHeader from "./ChatHeader";
import ChatSidebar from "./ChatSidebar";
import ChatMessages from "./ChatMessages";
import AuthModal from "./AuthModal";

export default function ChatPage() {
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

  const deleteChat = async (id: string | number) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/chats/${id}?user_id=${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat");
      const updated = chatHistory.filter(c => c.id !== id);
      setChatHistory(updated);
      if (currentChatId === id) startNewChat();
    } catch (err) {
      console.error(err);
    }
  };

  async function sendMessage(text: string) {
    const userMsg: Message = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    const idx = newMsgs.length;
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch(`${API_BASE}/copilot/chat/stream`, {
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

        // Process complete SSE events. Support both "\n\n" and "\r\n\r\n" delimiters
        // so streaming works reliably behind different proxies/servers.
        // Find the earliest event delimiter in the buffer.
        // eslint-disable-next-line no-constant-condition
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
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter((_, i) => i !== idx));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;
    if (!user) {
      setShowAuth(true);
      return;
    }

    await sendMessage(input);
  }

  return (
    <div className="relative flex h-screen bg-[#0D0D0D]">
      <ChatSidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        user={user}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onStartNewChat={startNewChat}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuth(true)}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1">
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
