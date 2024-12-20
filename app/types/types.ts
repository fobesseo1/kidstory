//types>types.ts
import { create } from 'zustand';

export type CurrentUserType = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  user_type: string | null;
  // current_points: number;
  // donation_id: string | null;
  // partner_name: string | null;
  // unread_messages_count: number;
  // updateCurrentPoints?: () => Promise<void>;
};

export type CardType = {
  id: number;
  card_id: string;
  card_category: string;
  card_title: string;
  card_content: string;
  user_id: string;
  created_at: string;
};
