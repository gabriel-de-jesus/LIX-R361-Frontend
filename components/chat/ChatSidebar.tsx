import React, { useState } from "react";
import { Chat, User } from "./types";

interface ChatSidebarProps {
  chatHistory: Chat[];
  currentChatId: string | number | null;
  user: User | null;
  isMobileSidebarOpen: boolean;
  onStartNewChat: () => void;
  onLoadChat: (id: string | number) => void;
  onDeleteChat: (id: string | number) => void;
  onLogout: () => void;
   onEditProfile: () => void;
   onDeleteAccount: () => void;
  onShowAuth: () => void;
  onCloseMobileSidebar: () => void;
}

interface SidebarContentProps {
  chatHistory: Chat[];
  currentChatId: string | number | null;
  user: User | null;
  onStartNewChat: () => void;
  onLoadChat: (id: string | number) => void;
  onDeleteChat: (id: string | number) => void;
  onLogout: () => void;
    onEditProfile: () => void;
    onDeleteAccount: () => void;
  onShowAuth: () => void;
  onAfterAction?: () => void;
  newChatLabel: string;
  authButtonLabel: string;
  chatListClassName: string;
  userSectionClassName: string;
}

export function SidebarContent({
  chatHistory,
  currentChatId,
  user,
  onStartNewChat,
  onLoadChat,
  onDeleteChat,
  onLogout,
  onEditProfile,
  onDeleteAccount,
  onShowAuth,
  onAfterAction,
  newChatLabel,
  authButtonLabel,
  chatListClassName,
  userSectionClassName,
}: SidebarContentProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const handleStartNewChat = () => {
    onStartNewChat();
    onAfterAction?.();
  };

  const handleLoadChat = (id: string | number) => {
    onLoadChat(id);
    onAfterAction?.();
  };

  const handleDeleteChat = (id: string | number) => {
    onDeleteChat(id);
  };

  const handleLogout = () => {
    onLogout();
    setConfigOpen(false);
    onAfterAction?.();
  };

  const handleEditProfile = () => {
    onEditProfile();
    setConfigOpen(false);
    onAfterAction?.();
  };

  const handleDeleteAccount = () => {
    onDeleteAccount();
    setConfigOpen(false);
    onAfterAction?.();
  };

  const handleShowAuth = () => {
    onShowAuth();
    onAfterAction?.();
  };

  return (
    <>
      {/* New Chat Button (text only when sidebar is open) */}
      <div className="p-3">
        <button
          onClick={handleStartNewChat}
          className="w-full px-4 py-2.5 bg-[#0D0D0D] hover:bg-[#2A2A2A] text-gray-300 hover:text-white font-medium rounded-xl transition-all text-center border border-[#2A2A2A] text-sm"
        >
          {newChatLabel}
        </button>
      </div>

      {/* Labadain services and Chat History */}
      <div className={chatListClassName}>
        {/* Labadain services (moved from top bar) */}
        <div className="px-3 pt-2 pb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Labadain-nia produtu seluk
          </div>
          <div className="space-y-0.5 text-sm">
            <a
              href="https://old.labadain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors mr-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 flex-shrink-0"
              >
                {/* Chat bubble icon */}
                <path d="M5.5 5.25h13a1.25 1.25 0 011.25 1.25v7a1.25 1.25 0 01-1.25 1.25H12l-3.5 3.25V14.75H5.5A1.25 1.25 0 014.25 13.5v-7A1.25 1.25 0 015.5 5.25z" />
              </svg>
              <span className="truncate">Labadain R361</span>
            </a>
            <a
              href="https://search.labadain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors mr-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 flex-shrink-0"
              >
                {/* External link icon for search engine */}
                <path d="M9.75 5.75h-3a1 1 0 00-1 1v11.5a1 1 0 001 1h11.5a1 1 0 001-1v-3" />
                <path d="M14 5h5v5" />
                <path d="M14 10L19 5" />
              </svg>
              <span className="truncate">Labadain Search</span>
            </a>
            <a
              href="https://www.timornews.tl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors mr-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 flex-shrink-0"
              >
                {/* News / article icon */}
                <rect x="4" y="5" width="9.5" height="14" rx="1.5" />
                <path d="M17 7h2.25A1.75 1.75 0 0121 8.75V17a2 2 0 01-2 2H13.5" />
                <path d="M6.5 8.5h4.5" />
                <path d="M6.5 11h4.5" />
                <path d="M6.5 13.5H10" />
              </svg>
              <span className="truncate">Timor News</span>
            </a>
          </div>
        </div>

        {user && chatHistory.length > 0 && (
          <>
            <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Ita-nia konversa sira
            </div>
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleLoadChat(chat.id)}
                className={`group relative flex items-center gap-3 px-3 py-1.5 rounded-xl cursor-pointer mb-0.5 mr-1 transition-all ${
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
                    handleDeleteChat(chat.id);
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
          </>
        )}
      </div>

      {/* User Info / Auth */}
      <div className={userSectionClassName}>
        {user ? (
          <div className="px-3 py-2">
            <button
              type="button"
              onClick={() => setConfigOpen((open) => !open)}
              className="w-full flex items-center gap-3 text-left hover:bg-[#1A1A1A] rounded-xl px-2 py-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm text-white">{user.name}</div>
                <div className="text-xs text-gray-400">Konfigurasaun</div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 text-gray-400 transition-transform ${configOpen ? "rotate-180" : "rotate-0"}`}
              >
                <path d="M6 8l4 4 4-4" />
              </svg>
            </button>

            {configOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <button
                  onClick={handleEditProfile}
                  className="w-full text-xs text-gray-200 hover:text-white hover:bg-[#1A1A1A] rounded-lg px-2 py-1 text-left transition-colors"
                >
                  Troka naran
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-xs text-gray-400 hover:text-gray-200 hover:bg-[#1A1A1A] rounded-lg px-2 py-1 text-left transition-colors"
                >
                  Sai (logout)
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full text-xs text-red-500 hover:text-red-300 hover:bg-[#1A1A1A] rounded-lg px-2 py-1 text-left transition-colors"
                >
                  Apaga konta
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleShowAuth}
            className="w-full px-4 py-2 border border-[#2A2A2A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white rounded-xl transition-all text-sm"
          >
            {authButtonLabel}
          </button>
        )}
      </div>
    </>
  );
}

export default function ChatSidebar({
  chatHistory,
  currentChatId,
  user,
  isMobileSidebarOpen,
  onStartNewChat,
  onLoadChat,
  onDeleteChat,
  onLogout,
  onEditProfile,
  onDeleteAccount,
  onShowAuth,
  onCloseMobileSidebar,
}: ChatSidebarProps) {


  return (
    <>
      {/* Desktop Sidebar removed: now handled by ChatPage for collapsible behavior */}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/60">
          <div className="absolute inset-y-0 left-0 w-72 max-w-full bg-[#0D0D0D] border-r border-[#2A2A2A] flex flex-col">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">Labadain Timor-Leste</span>
              <button
                type="button"
                onClick={onCloseMobileSidebar}
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
            <SidebarContent
              chatHistory={chatHistory}
              currentChatId={currentChatId}
              user={user}
              onStartNewChat={() => { onStartNewChat(); onCloseMobileSidebar(); }}
              onLoadChat={(id) => { onLoadChat(id); onCloseMobileSidebar(); }}
              onDeleteChat={onDeleteChat}
              onLogout={onLogout}
              onEditProfile={onEditProfile}
              onDeleteAccount={onDeleteAccount}
              onShowAuth={onShowAuth}
              // Do not close sidebar on delete, only on navigation actions
              newChatLabel="Konversa Foun"
              authButtonLabel="Login"
              chatListClassName="flex-1 overflow-y-auto px-2 py-2"
              userSectionClassName="p-3"
            />
          </div>
        </div>
      )}


    </>
  );
}
