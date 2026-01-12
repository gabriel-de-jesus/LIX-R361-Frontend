export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
  id?: number;
}

export type AuthProvider = "email" | "google" | "apple";

export interface User {
  id: number;
  email: string;
  name: string;
  token?: string;
  avatar_url?: string;
  is_active?: boolean;
  provider?: AuthProvider;
}

export interface Chat {
  id: string | number;
  title: string;
  messages: Message[];
  createdAt: number | string;
  updatedAt: number | string;
}

export interface MessageInteractionCounts {
  likes: number;
  dislikes: number;
  copies: number;
}
