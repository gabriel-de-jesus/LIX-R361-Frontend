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
            Di'ak
          </button>
        </div>
      </div>
    </div>
  );
}
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import React, { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Message, User } from "./types";

const INPUT_PLACEHOLDER = "Husu Labadain iha-ne'e...";
const INPUT_HELPER_TEXT = "Labadain bele fó resposta ne'ebé ladún loos. Konfirma filafali informasaun importante sira.";

interface ChatMessagesProps {
  messages: Message[];
  user: User | null;
  input: string;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onChangeInput: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>, file?: File | null) => void;
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
                  <SpeedInsights />
                  <Analytics />
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
}

function WelcomeText() {
  return (
    <>
      <h2 className="text-3xl font-semibold mb-3 text-white">Ita sei konversa ho Labadain</h2>
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
}: ChatInputWithSuggestionsProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string>("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setFileError('Ita-nia tamañu fixeiru liu tiha ona 500KB');
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

  // Wrap the onSubmit to clear file after submit and pass file to parent
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    onSubmit(e, selectedFile);
    setSelectedFile(null);
  };

  return (
    <>
      <PopupBox open={!!fileError} message={fileError} onClose={() => setFileError("")} />
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
        <div className="relative flex items-center">
          {/* Plus icon with dropdown */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10" tabIndex={0} onBlur={handleDropdownBlur}>
            <button
              type="button"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[#232323] text-[#20B8CD] hover:bg-[#1BA5BA] focus:outline-none focus:ring-2 focus:ring-[#20B8CD]"
              onClick={handleDropdown}
              aria-label="More options"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 min-w-fit bg-[#181818] border border-[#232323] rounded-lg shadow-lg py-1 px-1 animate-fade-in whitespace-nowrap" tabIndex={-1}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#232323] flex items-center gap-2 whitespace-nowrap"
                  onClick={() => { fileInputRef.current?.click(); }}
                >
                  {/* paperclip icon */}
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="inline-block">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.5l-5.25 5.25a3 3 0 01-4.24-4.24l9-9a2.121 2.121 0 013 3l-9 9" />
                  </svg>
                  Karrega fixeiru (Max. 500KB)
                </button>
              </div>
            )}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-12 py-4 pr-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#20B8CD] focus:border-transparent text-white placeholder-gray-500 transition-all text-base ${selectedFile ? 'pr-28' : ''}`}
            disabled={loading}
          />
          {/* File preview inside input */}
          {selectedFile && (
            <span className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center bg-[#232323] px-2 py-1 rounded text-xs text-[#20B8CD] max-w-[120px] truncate">
              <span className="truncate mr-1">{selectedFile.name}</span>
              <button type="button" onClick={handleRemoveFile} className="ml-1 text-gray-400 hover:text-red-400 focus:outline-none">&times;</button>
            </span>
          )}
          <button
            type="submit"
            disabled={loading || (!input.trim() && !selectedFile)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#20B8CD] hover:bg-[#1BA5BA] disabled:bg-[#2A2A2A] disabled:cursor-not-allowed text-white rounded-xl transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className={`text-center text-xs text-gray-500 ${helperMarginClass}`}>
          {helperText}
        </p>
      </form>
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
        <div className="max-w-3xl mx-auto px-4 py-8 h-full pb-40 lg:pb-8">
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
                  />
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
        />
      </div>
    </>
  );
}
