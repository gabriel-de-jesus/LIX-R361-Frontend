import React, { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
}

interface User {
  id: number;
  email: string;
  name: string;
  token?: string;
  avatar_url?: string;
  is_active?: boolean;
}

interface Chat {
  id: string | number;
  title: string;
  messages: Message[];
  createdAt: number | string;
  updatedAt: number | string;
}

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
  const [activeSuggestionInput, setActiveSuggestionInput] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderContent = (text: string) => {
    if (!text) return null;

    return (
      <div className="prose prose-invert max-w-none text-gray-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Style links
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#20B8CD] hover:text-[#1BA5BA] underline decoration-[#20B8CD]/30 hover:decoration-[#20B8CD] transition-all underline-offset-2 break-words"
              />
            ),
            // ChatGPT-like code blocks with header + copy
            code: ({ node, inline, className, children, ...props }: any) => {
              // Normalize children to a flat text string for copy,
              // but render the original children to preserve highlighting.
              const childArray = React.Children.toArray(children);
              const codeText = childArray
                .map((child: any) => (typeof child === "string" ? child : ""))
                .join("");

              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 bg-[#2A2A2A] rounded text-[#20B8CD] font-mono text-sm not-prose"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              const match = /language-(\w+)/.exec(className || "");
              const language = match?.[1] || "code";

              const handleCopy = () => {
                const textToCopy = codeText || (typeof children === "string" ? (children as string) : "");
                if (!textToCopy) return;
                navigator.clipboard?.writeText(textToCopy).catch(() => {
                  // ignore copy errors
                });
              };

              return (
                <div className="rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#0D0D0D] my-4 not-prose">
                  <div className="bg-[#1A1A1A] px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      {language}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-xs text-gray-400 hover:text-[#20B8CD] transition-colors px-2 py-1 rounded hover:bg-[#2A2A2A]"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 m-0 w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words">
                    <code
                      className={`text-sm text-gray-200 font-mono leading-relaxed block whitespace-pre-wrap break-words ${className || ""}`}
                      {...props}
                    >
                      {children}
                    </code>
                  </pre>
                </div>
              );
            },
            // Style paragraphs
            p: ({ node, ...props }) => (
              <p className="leading-7 mb-4 last:mb-0 text-gray-200" {...props} />
            ),
            // Style lists
            ul: ({ node, ...props }) => (
              <ul className="space-y-2 pl-6 my-4 list-disc marker:text-[#20B8CD]" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="space-y-2 pl-6 my-4 list-decimal marker:text-[#20B8CD]" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="leading-7 text-gray-200" {...props} />
            ),
            // Style headings
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0" {...props} />
            ),
            // Style blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-[#20B8CD] pl-4 italic text-gray-300 my-4" {...props} />
            ),
            // Style strong/bold
            strong: ({ node, ...props }) => (
              <strong className="font-semibold text-white" {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

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
    setActiveSuggestionInput(null);
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

  const getSuggestions = (text: string): string[] => {
    const trimmed = text.trim();

    if (!trimmed) {
      return [
        "Favór ida fó ezemplu karta aplikasaun ba vaga finansas!",
        "Ajuda hakerek email ida ba konvite reuniaun negósiu nian.",
        "Tradús testu ne'e ba Portugés: Ha'u hadomi Timor-Leste.",
        "Oinsá situasaun edukasaun daudaun ne'e iha Timor-Leste?",
        'Favór kuriji ortografia Tetun: "Nia ne kole tanba hlo serbicu barak."',
      ];
    }
    // After the user starts typing (non-empty input),
    // do not show any suggestions.
    return [];
  };

  const suggestions = getSuggestions(input);

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

        // Process complete SSE events separated by blank lines ("\n\n")
        let eventEndIndex;
        while ((eventEndIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, eventEndIndex);
          buffer = buffer.slice(eventEndIndex + 2);

          const lines = rawEvent.split("\n");
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

  async function handleSuggestionClick(text: string) {
    const value = text.trim();
    if (!value || loading) return;

    if (!user) {
      setInput(value);
      setShowAuth(true);
      return;
    }

    await sendMessage(value);
    setActiveSuggestionInput(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;
    if (!user) {
      setShowAuth(true);
      return;
    }

    setActiveSuggestionInput(null);
    await sendMessage(input);
  }

  return (
    <div className="relative flex h-screen bg-[#0D0D0D]">
      {/* Minimal Sidebar (desktop only) */}
      <div className="hidden lg:flex lg:flex-col w-72 bg-[#0D0D0D] border-r border-[#2A2A2A]">
        {/* New Chat Button */}
        <div className="p-3">
          <button 
            onClick={startNewChat} 
            className="w-full px-4 py-2.5 bg-[#0D0D0D] hover:bg-[#2A2A2A] text-gray-300 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-[#2A2A2A]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Konversa Foun
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2">
          {chatHistory.map(chat => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-all ${
                currentChatId === chat.id 
                  ? "bg-[#2A2A2A] text-white" 
                  : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{chat.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#0D0D0D] rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="p-3">
          {user ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm text-white">{user.name}</div>
                <button 
                  onClick={handleLogout} 
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuth(true)} 
              className="w-full px-4 py-2 border border-[#2A2A2A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white rounded-xl transition-all text-sm"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Minimal Header */}
        <div className="bg-[#0D0D0D] px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1">
            {/* Mobile header: always visible on small screens */}
            <div className="lg:hidden">
              <h1 className="text-xl font-semibold text-white">
                Labadain LIX-R361
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Asistente AI ba Tetun
              </p>
            </div>

            {/* Desktop/laptop header: same as mobile, always visible on large screens */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-white">
                Labadain LIX-R361
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Asistente AI ba Tetun
              </p>
            </div>
          </div>
          {/* Mobile menu button to open sidebar */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg border border-[#2A2A2A] text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors ml-3"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar Overlay (wrap menu for left bar) */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black/60">
            <div className="absolute inset-y-0 left-0 w-72 max-w-full bg-[#0D0D0D] border-r border-[#2A2A2A] flex flex-col">
              <div className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">Istóriku Konversa Sira</span>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-3">
                <button
                  onClick={() => {
                    startNewChat();
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full px-4 py-2.5 bg-[#0D0D0D] hover:bg-[#2A2A2A] text-gray-300 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-[#2A2A2A] text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Konvers Foun
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-2">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      loadChat(chat.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-all ${
                      currentChatId === chat.id
                        ? "bg-[#2A2A2A] text-white"
                        : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{chat.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#0D0D0D] rounded-lg transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-3">
                {user ? (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm text-white">{user.name}</div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileSidebarOpen(false);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuth(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full px-4 py-2 border border-[#2A2A2A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white rounded-xl transition-all text-sm"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 h-full pb-40 lg:pb-8">
            {messages.length === 0 && (
              <>
                {/* Mobile & small devices: centered welcome state */}
                <div className="lg:hidden flex flex-col items-center justify-center text-center h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center">
                      <img
                        src="/ai-avatar.png"
                        alt="AI assistant avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <h2 className="text-3xl font-semibold mb-3 text-white">Oinsá ha'u bele ajuda ita?</h2>
                  <p className="text-gray-400 text-lg">Bele husu ba ha'u saida de'it iha Tetun</p>
                </div>

                {/* Desktop & laptops: avatar + same welcome text above centered input */}
                <div className="hidden lg:flex h-full items-center justify-center">
                  <div className="w-full">
                    <div className="mb-6 text-center flex flex-col items-center">
                      <div className="mb-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center">
                          <img
                            src="/ai-avatar.png"
                            alt="AI assistant avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <h2 className="text-3xl font-semibold mb-3 text-white">Oinsá ha'u bele ajuda ita?</h2>
                      <p className="text-gray-400 text-lg">Bele husu ba ha'u saida de'it iha Tetun</p>
                    </div>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={input}
                          onFocus={() => setActiveSuggestionInput("welcome")}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Hakerek ita-nia pergunta iha-ne'e..."
                          className="w-full px-5 py-4 pr-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all text-base"
                          disabled={loading}
                        />
                        <button
                          type="submit"
                          disabled={loading || !input.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#20B8CD] hover:bg-[#1BA5BA] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed text-white rounded-xl transition-all"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                          )}
                        </button>
                        {activeSuggestionInput === "welcome" && suggestions.length > 0 && (
                          <div className="absolute left-0 right-14 top-full mt-2 z-20 rounded-xl border border-[#2A2A2A] bg-[#141414] shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.slice(0, 5).map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                disabled={loading}
                                onClick={() => handleSuggestionClick(s)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#1F1F1F] disabled:opacity-60 border-b border-[#2A2A2A]/40 last:border-b-0"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-3">
                        Labadain bele fó resposta ne'ebé ladún loos. Konfirma filafali informasaun importante sira.
                      </p>
                    </form>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className="group">
                  {msg.role === "user" ? (
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          (user?.name[0].toUpperCase() || "U")
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="text-white text-base leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-start">
                      <div className="flex items-center gap-2 flex-shrink-0 text-gray-300 text-sm">
                        <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center overflow-hidden">
                          <img
                            src="/ai-avatar.png"
                            alt="AI assistant avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {msg.streaming && !msg.content.trim() && (
                          <>
                            {/* <span className="ml-2">Sei hanoin...</span> */}
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} className="h-32 lg:h-0" />
          </div>
        </div>

        {/* Input Area */}
        {/* Mobile & small devices: fixed at bottom */}
        <div className="bg-[#0D0D0D] p-4 lg:hidden fixed inset-x-0 bottom-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                value={input}
                onFocus={() => setActiveSuggestionInput("mobile")}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hakerek pergunta iha-ne'e..."
                className="w-full px-5 py-4 pr-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all text-base"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#20B8CD] hover:bg-[#1BA5BA] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                )}
              </button>
              {activeSuggestionInput === "mobile" && suggestions.length > 0 && (
                <div className="absolute left-0 right-14 top-full mt-2 z-20 rounded-xl border border-[#2A2A2A] bg-[#141414] shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.slice(0, 5).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#1F1F1F] disabled:opacity-60 border-b border-[#2A2A2A]/40 last:border-b-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-center text-xs text-gray-500 mt-1">
              Labadain bele fó resposta ne'ebé ladún loos. Konfirma filafali informasaun importante sira.
            </p>
          </form>
        </div>

        {/* Desktop & laptops: bottom input only when there are messages */}
        {messages.length > 0 && (
          <div className="bg-[#0D0D0D] p-4 hidden lg:block">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onFocus={() => setActiveSuggestionInput("desktop")}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hakerek pergunta iha-ne'e..."
                  className="w-full px-5 py-4 pr-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all text-base"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#20B8CD] hover:bg-[#1BA5BA] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed text-white rounded-xl transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  )}
                </button>
                {activeSuggestionInput === "desktop" && suggestions.length > 0 && (
                  <div className="absolute left-0 right-14 top-full mt-2 z-20 rounded-xl border border-[#2A2A2A] bg-[#141414] shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.slice(0, 5).map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={loading}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#1F1F1F] disabled:opacity-60 border-b border-[#2A2A2A]/40 last:border-b-0"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-gray-500 mt-1">
                Labadain bele fó resposta ne'ebé ladún loos. Konfirma filafali informasaun importante sira.
              </p>
            </form>
          </div>
        )}
      </div>

      {/* Auth Overlay (login/signup) */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-[#1A1A1A] rounded-2xl shadow-2xl border border-[#2A2A2A]">
            <div className="p-8">
              <h1 className="text-3xl font-semibold text-center mb-2 text-white">
                {authMode === "login" ? "Labadain LIX-R361" : "Kria konta iha LIX-R361"}
              </h1>
              <p className="text-center text-gray-400 mb-8">
                {authMode === "login" ? "Login hodi bele asesu" : "Kria konta foun ida ba asesu"}
              </p>
              <form onSubmit={handleAuth} className="space-y-4">
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
              <div className="mt-4 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setAuthError("Google authentication failed.")}
                  shape="pill"
                  text={authMode === "login" ? "continue_with" : "signup_with"}
                />
              </div>
              {authError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-xl">
                  <span className="text-red-400 text-sm">{authError}</span>
                </div>
              )}
              <p className="text-center text-sm mt-6 text-gray-400">
                {authMode === "login" ? "Seidauk iha konta? " : "Konta iha tiha ona? "}
                <button
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-[#20B8CD] hover:text-[#1BA5BA] transition-colors"
                >
                  {authMode === "login" ? "Kria Konta" : "Login"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
