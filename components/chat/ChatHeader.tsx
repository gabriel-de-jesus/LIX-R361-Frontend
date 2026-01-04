import React from "react";
import Link from "next/link";

interface ChatHeaderProps {
  onOpenMobileSidebar: () => void;
}

export default function ChatHeader({ onOpenMobileSidebar }: ChatHeaderProps) {
  return (
    <div className="bg-[#0D0D0D] px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-[#2A2A2A]">
      <div className="flex items-center flex-1 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-white truncate">
            Labadain LIX-R361
          </h1>
          <p className="text-xs text-gray-500 mt-1 truncate">
            Hafasil ita-nia moris
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-4 text-xs lg:text-sm text-gray-300 mr-3">
        <a
          href="https://old.labadain.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white whitespace-nowrap"
        >
          Labadain Chat R361
        </a>
        <a
          href="https://search.labadain.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white whitespace-nowrap"
        >
          Labadain Search
        </a>
        <a
          href="https://www.timornews.tl"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white whitespace-nowrap"
        >
          Timor News
        </a>
        <Link href="/kontaktu" className="hover:text-white whitespace-nowrap">
          Kontaktu
        </Link>
      </nav>

      {/* Mobile menu button to open sidebar */}
      <button
        type="button"
        className="md:hidden p-2 rounded-lg border border-[#2A2A2A] text-gray-300 hover:bg-[#2A2A2A] hover:text-white transition-colors ml-3 flex-shrink-0"
        onClick={onOpenMobileSidebar}
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
  );
}
