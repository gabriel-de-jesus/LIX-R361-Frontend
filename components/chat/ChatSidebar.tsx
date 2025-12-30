import React from "react";
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
  onShowAuth: () => void;
  onAfterAction?: () => void;
  newChatLabel: string;
  authButtonLabel: string;
  chatListClassName: string;
  userSectionClassName: string;
}

function SidebarContent({
  chatHistory,
  currentChatId,
  user,
  onStartNewChat,
  onLoadChat,
  onDeleteChat,
  onLogout,
  onShowAuth,
  onAfterAction,
  newChatLabel,
  authButtonLabel,
  chatListClassName,
  userSectionClassName,
}: SidebarContentProps) {
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
    onAfterAction?.();
  };

  const handleShowAuth = () => {
    onShowAuth();
    onAfterAction?.();
  };

  return (
    <>
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleStartNewChat}
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
          {newChatLabel}
        </button>
      </div>

      {/* Chat History */}
      <div className={chatListClassName}>
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleLoadChat(chat.id)}
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
      </div>

      {/* User Info / Auth */}
      <div className={userSectionClassName}>
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
  onShowAuth,
  onCloseMobileSidebar,
}: ChatSidebarProps) {
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | number | null>(null);

  const handleRequestDeleteChat = (id: string | number) => {
    setPendingDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId !== null) {
      onDeleteChat(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col w-72 bg-[#0D0D0D] border-r border-[#2A2A2A]">
        <SidebarContent
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          user={user}
          onStartNewChat={onStartNewChat}
          onLoadChat={onLoadChat}
          onDeleteChat={handleRequestDeleteChat}
          onLogout={onLogout}
          onShowAuth={onShowAuth}
          newChatLabel="Konversa Foun"
          authButtonLabel="Sign in"
          chatListClassName="flex-1 overflow-y-auto px-2"
          userSectionClassName="p-3"
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/60">
          <div className="absolute inset-y-0 left-0 w-72 max-w-full bg-[#0D0D0D] border-r border-[#2A2A2A] flex flex-col">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">Istóriku Konversa Sira</span>
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
              onStartNewChat={onStartNewChat}
              onLoadChat={onLoadChat}
              onDeleteChat={handleRequestDeleteChat}
              onLogout={onLogout}
              onShowAuth={onShowAuth}
              onAfterAction={onCloseMobileSidebar}
              newChatLabel="Konvers Foun"
              authButtonLabel="Login"
              chatListClassName="flex-1 overflow-y-auto px-2 py-2"
              userSectionClassName="p-3"
            />
          </div>
        </div>
      )}

      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-2">Labadain LX-361</h2>
            <p className="text-sm text-gray-300 mb-4">
              Ita hakarak hamoos istóriku konversa ida-ne'e?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
              >
                Lae
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#20B8CD] hover:bg-[#1BA5BA] transition-colors"
              >
                Loos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
