export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  token?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface Chat {
  id: string | number;
  title: string;
  messages: Message[];
  createdAt: number | string;
  updatedAt: number | string;
}
