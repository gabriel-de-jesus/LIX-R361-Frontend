import React, { useState } from "react";
import { MessageInteractionCounts } from "./types";

interface MessageActionsProps {
  messageId?: number;
  messageContent: string;
  userId?: number;
}

export function MessageActions({
  messageId,
  messageContent,
  userId,
}: MessageActionsProps) {
  const [, setCounts] = useState<MessageInteractionCounts>({
    likes: 0,
    dislikes: 0,
    copies: 0,
    share_fb: 0,
    share_linkedin: 0,
    share_link: 0,
  });

  const [userInteractions, setUserInteractions] = useState<string[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  // Fetch initial counts when component mounts
  React.useEffect(() => {
    if (messageId) {
      fetch(`${apiBaseUrl}/messages/${messageId}/interactions`)
        .then((res) => res.json())
        .then((data) => {
          setCounts({
            likes: data.likes || 0,
            dislikes: data.dislikes || 0,
            copies: data.copies || 0,
            share_fb: data.share_fb || 0,
            share_linkedin: data.share_linkedin || 0,
            share_link: data.share_link || 0,
          });
        })
        .catch((err) => console.error("Failed to fetch interaction counts:", err));
    }
  }, [messageId, apiBaseUrl]);

  const recordInteraction = async (type: string) => {
    if (!messageId) return;

    try {
      const response = await fetch(`${apiBaseUrl}/messages/${messageId}/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_id: messageId,
          interaction_type: type,
          user_id: userId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCounts({
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          copies: data.copies || 0,
          share_fb: data.share_fb || 0,
          share_linkedin: data.share_linkedin || 0,
          share_link: data.share_link || 0,
        });
        setUserInteractions((prev) => (prev.includes(type) ? prev : [...prev, type]));
      }
    } catch (error) {
      console.error(`Failed to record ${type} interaction:`, error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      await recordInteraction("copy");
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleLike = () => {
    if (!userInteractions.includes("like")) {
      recordInteraction("like");
    }
  };

  const handleDislike = () => {
    if (!userInteractions.includes("dislike")) {
      recordInteraction("dislike");
    }
  };

  return (
    <div className="flex items-center gap-0 mt-3 pt-3">
      {/* Copy Button (ChatGPT-style copy icon) */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
          userInteractions.includes("copy")
            ? "text-[#20B8CD] bg-[#1A1A1A]"
            : "text-gray-400 hover:text-[#20B8CD] hover:bg-[#1A1A1A]"
        }`}
        title="Kópia"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={userInteractions.includes("copy") ? "currentColor" : "none"}
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          {/* back square */}
          <rect x="9" y="9" width="8" height="8" rx="2" />
          {/* front square */}
          <rect x="5" y="5" width="8" height="8" rx="2" />
        </svg>
      </button>

      {/* Like Button (ChatGPT-style thumbs up) */}
      {!userInteractions.includes("dislike") && (
        <button
          onClick={handleLike}
          disabled={userInteractions.includes("like")}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            userInteractions.includes("like")
              ? "text-[#20B8CD] bg-[#1A1A1A]"
              : "text-gray-400 hover:text-[#20B8CD] hover:bg-[#1A1A1A]"
          }`}
              title="Gosta"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={userInteractions.includes("like") ? "currentColor" : "none"}
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            {/* Heroicons-like hand thumbs up */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25H4.875A1.875 1.875 0 003 10.125v7.5A1.875 1.875 0 004.875 19.5H7.5m0-11.25l2.64-4.4A1.5 1.5 0 0111.46 3h.665c.621 0 1.13.504 1.13 1.125 0 1.035-.21 1.74-.568 2.283-.36.546-.687.86-.687 1.842v.75h3.927c.978 0 1.8.804 1.752 1.78-.074 1.485-.43 3.702-1.262 5.37-.51 1.02-1.225 1.8-2.31 1.8H9.75a2.25 2.25 0 01-2.25-2.25V8.25z"
            />
          </svg>
        </button>
      )}

      {/* Dislike Button (ChatGPT-style thumbs down) */}
      {!userInteractions.includes("like") && (
        <button
          onClick={handleDislike}
          disabled={userInteractions.includes("dislike")}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            userInteractions.includes("dislike")
                ? "text-red-400 bg-[#1A1A1A]"
                : "text-gray-400 hover:text-red-400 hover:bg-[#1A1A1A]"
              }`}
              title="La gosta"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={userInteractions.includes("dislike") ? "currentColor" : "none"}
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 rotate-180"
          >
            {/* reuse thumbs up path rotated for thumbs down */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25H4.875A1.875 1.875 0 003 10.125v7.5A1.875 1.875 0 004.875 19.5H7.5m0-11.25l2.64-4.4A1.5 1.5 0 0111.46 3h.665c.621 0 1.13.504 1.13 1.125 0 1.035-.21 1.74-.568 2.283-.36.546-.687.86-.687 1.842v.75h3.927c.978 0 1.8.804 1.752 1.78-.074 1.485-.43 3.702-1.262 5.37-.51 1.02-1.225 1.8-2.31 1.8H9.75a2.25 2.25 0 01-2.25-2.25V8.25z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
