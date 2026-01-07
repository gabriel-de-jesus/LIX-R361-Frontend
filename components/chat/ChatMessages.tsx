import React, { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Message, User } from "./types";
import { MessageActions } from "./MessageActions";

const INPUT_PLACEHOLDER = "Husu Labadain iha-ne'e...";
const INPUT_HELPER_TEXT = "Labadain bele fó resposta ne'ebé ladún loos. Konfirma filafali informasaun importante sira.";
const MAX_WORDS = 120;

interface ChatMessagesProps {
  messages: Message[];
  user: User | null;
  input: string;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onChangeInput: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>, file?: File | null) => void;
  onCancel: () => void;
  onToolsChange?: (tools: string[]) => void;
}

const renderContent = (text: string) => {
  if (!text) return null;

  return (
    <div className="prose prose-invert max-w-none text-gray-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#20B8CD] hover:text-[#1BA5BA] underline decoration-[#20B8CD]/30 hover:decoration-[#20B8CD] transition-all underline-offset-2 break-words"
            />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
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
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#20B8CD] transition-colors px-2 py-1 rounded hover:bg-[#2A2A2A]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5"
                    >
                      <rect x="8" y="8" width="11" height="13" rx="2" />
                      <path d="M6 17V5a2 2 0 0 1 2-2h9" />
                    </svg>
                    <span>Copy</span>
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
          p: ({ node, ...props }) => (
            <p className="leading-7 mb-4 last:mb-0 text-gray-200" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="space-y-2 pl-6 my-4 list-disc marker:text-[#20B8CD]" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="space-y-2 pl-6 my-4 list-decimal marker:text-[#20B8CD]" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-7 text-gray-200" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-[#20B8CD] pl-4 italic text-gray-300 my-4" {...props} />
          ),
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

interface ChatInputWithSuggestionsProps {
  mode: "welcome" | "mobile" | "desktop";
  input: string;
  loading: boolean;
  onChangeInput: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>, file?: File | null) => void;
  placeholder: string;
  helperText: string;
  formClassName: string;
  helperMarginClass: string;
  onCancel: () => void;
  onToolsChange?: (tools: string[]) => void;
}

function WelcomeText() {
  return (
    <>
      <h2 className="text-3xl font-semibold mb-1.5 text-white">Ita sei konversa ho Labadain</h2>
      <p className="text-gray-400 text-lg">Ita-nia asistente AI ba Tetun</p>
    </>
  );
}

function ChatInputWithSuggestions({
  mode,
  input,
  loading,
  onChangeInput,
  onSubmit,
  placeholder,
  helperText,
  formClassName,
  helperMarginClass,
  onCancel,
  onToolsChange,
}: ChatInputWithSuggestionsProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string>("");
  const [textError, setTextError] = React.useState<string>("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [toolDropdownOpen, setToolDropdownOpen] = React.useState(false);
  const [selectedTools, setSelectedTools] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024) {
        setFileError('Ita-nia fixeiru la konsege karrega ho susesu tanba tamañu liu tiha ona 15KB.');
        e.target.value = '';
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
    setDropdownOpen(false);
  };
  const handleRemoveFile = () => setSelectedFile(null);
  const handleDropdown = () => setDropdownOpen((v) => !v);
  const handleDropdownBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(false);
  };

  const handleToolDropdownToggle = () => setToolDropdownOpen((v) => !v);
  const handleToolDropdownBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setToolDropdownOpen(false);
  };

  const handleSelectTool = (tool: string) => {
    setSelectedTools((current) => {
      const next = current.includes(tool)
        ? current.filter((t) => t !== tool)
        : [...current, tool];
      onToolsChange?.(next);
      return next;
    });
    setToolDropdownOpen(false);
  };
  const handleClearTool = (tool: string) => {
    setSelectedTools((current) => {
      const next = current.filter((t) => t !== tool);
      onToolsChange?.(next);
      return next;
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const trimmed = value.trim();

    if (!trimmed) {
      onChangeInput("");
      return;
    }

    const words = trimmed.split(/\s+/);
    if (words.length <= MAX_WORDS) {
      onChangeInput(value);
      return;
    }

    const limited = words.slice(0, MAX_WORDS).join(" ");
    onChangeInput(limited);

    setTextError(
      "Ita-boot nia testu liu ona limite. Labadain rekomenda atu ita-boot bele tau ba fixeiru ida depois karrega ba iha plataforma."
    );
  };

  // PopupBox for error/info messages
function PopupBox({ open, message, onClose }: { open: boolean; message: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl px-6 py-5 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-2">Labadain LIX-R361</h2>
        <p className="text-sm text-gray-300 mb-4 flex items-center gap-2">
          {message}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FBBF24" className="w-5 h-5 inline-block">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#20B8CD] hover:bg-[#1BA5BA] transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
  
  // Wrap the onSubmit to clear file after submit and pass file to parent
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    onSubmit(e, selectedFile);
    setSelectedFile(null);
  };

  return (
    <>
      <PopupBox open={!!fileError} message={fileError} onClose={() => setFileError("")} />
      <PopupBox open={!!textError} message={textError} onClose={() => setTextError("")} />
      <form onSubmit={handleSubmit} className={formClassName}>
        {/* Always render file input for Chrome compatibility */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          disabled={loading}
        />
        <div className="relative w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-3 pt-2 pb-3">
          {/* First line: text input */}
          <div className="w-full mb-4">
            <input
              type="text"
              value={input}
              onChange={handleTextChange}
              placeholder={placeholder}
              className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-500 text-lg"
              disabled={loading}
            />
          </div>
          {/* File preview just below input, aligned left */}
          {selectedFile && (
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-[#20B8CD] bg-[#232323] rounded px-2 py-1">
              <span className="truncate mr-1 max-w-[200px]">{selectedFile.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-1 text-gray-400 hover:text-red-400 focus:outline-none"
              >
                &times;
              </button>
            </div>
          )}
          {/* Second line: actions + submit/cancel */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              {/* Clip icon with dropdown */}
              <div className="relative group" tabIndex={0} onBlur={handleDropdownBlur}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2A2A2A] bg-transparent text-sm text-gray-200 hover:border-[#20B8CD] hover:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#20B8CD] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleDropdown}
                  aria-label="More options"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#232323] text-[#20B8CD]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24L9.88 16.12a1 1 0 01-1.41-1.41l7.78-7.78"
                      />
                    </svg>
                  </span>
                  <span className="text-sm hidden sm:inline">Aneksu</span>
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 min-w-fit bg-[#181818] border border-[#232323] rounded-lg shadow-lg py-1 px-1 animate-fade-in whitespace-nowrap"
                    tabIndex={-1}
                  >
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#232323] flex items-center gap-2 whitespace-nowrap"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      {/* paperclip icon */}
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="inline-block"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24L9.88 16.12a1 1 0 01-1.41-1.41l7.78-7.78"
                        />
                      </svg>
                      Karrega fixeiru (Max. 15KB)
                    </button>
                  </div>
                )}
              </div>

              {/* Ferramenta button with dropdown */}
              <div className="relative group" tabIndex={0} onBlur={handleToolDropdownBlur}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2A2A2A] bg-transparent text-sm text-gray-200 hover:border-[#20B8CD] hover:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#20B8CD] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleToolDropdownToggle}
                  aria-label="Hili ferramenta"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#232323] text-[#20B8CD]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      {/* magic-wand style tools icon */}
                      <path d="M5 19l6-6" />
                      <rect x="11" y="5" width="5" height="5" rx="1.2" />
                      <path d="M8 5.5L7.2 4" />
                      <path d="M6 8l-1.5.8" />
                      <path d="M16.5 15l1 .5" />
                      <path d="M15.5 6L17 5.2" />
                    </svg>
                  </span>
                  <span className="text-sm hidden sm:inline">Ferramenta</span>
                </button>
                {selectedTools.map((tool) => (
                  <span
                    key={tool}
                    className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#232323] text-xs text-[#20B8CD] whitespace-nowrap"
                  >
                    <span>{tool}</span>
                    <button
                      type="button"
                      onClick={() => handleClearTool(tool)}
                      className="text-gray-400 hover:text-red-400 focus:outline-none"
                      aria-label="Hasai ferramenta selecionada"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {toolDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 min-w-fit bg-[#181818] border border-[#232323] rounded-lg shadow-lg py-1 px-1 animate-fade-in whitespace-nowrap"
                    tabIndex={-1}
                  >
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#232323] flex items-center gap-2 whitespace-nowrap"
                      onClick={() => handleSelectTool("Peskiza Web")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <path d="M4 12h16" />
                        <path d="M12 4a9 9 0 010 16" className="opacity-80" />
                        <path d="M9 4.5a13 13 0 000 15" className="opacity-80" />
                      </svg>
                      Peskiza Web
                    </button>
                  </div>
                )}
              </div>
            </div>
            {loading ? (
              <div className="relative group">
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-2.5 bg-[#20B8CD] hover:bg-[#1BA5BA] text-white rounded-xl transition-all"
                  aria-label="Cancel generation"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <rect x="7" y="7" width="10" height="10" rx="2" />
                  </svg>
                </button>
                <span className="pointer-events-none absolute -top-8 right-1/2 translate-x-1/2 px-2 py-1 rounded bg-[#1A1A1A] text-xs text-gray-200 border border-[#2A2A2A] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all whitespace-nowrap">
                  Kansela
                </span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !selectedFile}
                className="p-2.5 bg-[#20B8CD] hover:bg-[#1BA5BA] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>
      {helperText && (
        <p className={`${helperMarginClass} text-xs text-gray-400 text-center`}>
          {helperText}
        </p>
      )}
    </>
  );
}

export default function ChatMessages({
  messages,
  user,
  input,
  loading,
  messagesEndRef,
  onChangeInput,
  onSubmit,
  onCancel,
  onToolsChange,
}: ChatMessagesProps) {
  const [statusPhase, setStatusPhase] = useState<"prosesa" | "analiza" | "finaliza">("prosesa");

  const hasPendingStream = messages.some(
    (msg) => msg.role === "assistant" && msg.streaming && !msg.content.trim()
  );

  useEffect(() => {
    let timerAnaliza: ReturnType<typeof setTimeout> | undefined;
    let timerFinaliza: ReturnType<typeof setTimeout> | undefined;

    if (hasPendingStream) {
      setStatusPhase("prosesa");
      timerAnaliza = setTimeout(() => {
        setStatusPhase("analiza");
      }, 2000);
      timerFinaliza = setTimeout(() => {
        setStatusPhase("finaliza");
      }, 5000);
    } else {
      setStatusPhase("prosesa");
    }

    return () => {
      if (timerAnaliza) clearTimeout(timerAnaliza);
      if (timerFinaliza) clearTimeout(timerFinaliza);
    };
  }, [hasPendingStream]);

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 h-full pb-56 lg:pb-8">
          {messages.length === 0 && (
            <>
              {/* Mobile & small devices: centered welcome state */}
              <div className="lg:hidden flex flex-col items-center justify-center text-center h-full">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center">
                    <img
                      src="/ai-avatar.png"
                      alt="AI assistant avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <WelcomeText />
              </div>

              {/* Desktop & laptops: avatar + same welcome text above centered input */}
              <div className="hidden lg:flex h-full items-center justify-center">
                <div className="w-full">
                  <div className="mb-6 text-center flex flex-col items-center">
                    <div className="mb-3">
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center">
                        <img
                          src="/ai-avatar.png"
                          alt="AI assistant avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <WelcomeText />
                  </div>
                  <ChatInputWithSuggestions
                    mode="welcome"
                    input={input}
                    loading={loading}
                    onChangeInput={onChangeInput}
                    onSubmit={onSubmit}
                    placeholder={INPUT_PLACEHOLDER}
                    helperText={INPUT_HELPER_TEXT}
                    formClassName="mt-4 space-y-3"
                    helperMarginClass="mt-3"
                    onCancel={onCancel}
                    onToolsChange={onToolsChange}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-8">
            {messages.map((msg, i) => (
              <div key={msg.id ?? i} className="group">
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
                        <div className="flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-5 h-5 animate-spin"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="4"
                            />
                            <path
                              fill="#FFFFFF"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4A10 10 0 002 12h2z"
                            />
                          </svg>
                          <span className="text-gray-400 text-sm">
                            {statusPhase === "prosesa"
                              ? "Prosesa..."
                              : statusPhase === "analiza"
                              ? "Analiza…"
                              : "Finaliza..."}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      {renderContent(msg.content)}
                      {msg.content && !msg.streaming && (
                        <MessageActions
                          messageId={msg.id}
                          messageContent={msg.content}
                          userId={user?.id}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} className="h-56 lg:h-0" />
        </div>
      </div>

      {/* Input Area */}
      {/* Single bottom input: fixed on mobile, conditional on desktop */}
      <div
        className={`bg-[#0D0D0D] p-4 fixed lg:static inset-x-0 bottom-0 ${
          messages.length > 0 ? "lg:block" : "lg:hidden"
        }`}
      >
        <ChatInputWithSuggestions
          mode="mobile"
          input={input}
          loading={loading}
          onChangeInput={onChangeInput}
          onSubmit={onSubmit}
          placeholder={INPUT_PLACEHOLDER}
          helperText={INPUT_HELPER_TEXT}
          formClassName="max-w-3xl mx-auto space-y-3"
          helperMarginClass="mt-1"
          onCancel={onCancel}
          onToolsChange={onToolsChange}
        />
      </div>
    </>
  );
}
