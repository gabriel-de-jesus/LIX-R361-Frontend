import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import React, { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
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
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const renderContent = (text: string) => {
  if (!text) return null;

  return (
    <div className="prose prose-invert max-w-none text-gray-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
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
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
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
  return (
    <form onSubmit={onSubmit} className={formClassName}>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => onChangeInput(e.target.value)}
          placeholder={placeholder}
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
      </div>
      <p className={`text-center text-xs text-gray-500 ${helperMarginClass}`}>
        {helperText}
      </p>
    </form>
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
                  <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center">
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
                      <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#20B8CD] to-[#1BA5BA] flex items-center justify-center">
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
                        <>
                          <span className="text-gray-400 text-sm mr-2">Sei hanoin...</span>
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
