export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalPrompts: number;
  totalPineapplesEarned: number;
  totalPineapplesRedeemed: number;
  activeListings: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  pineapple_balance: number | null;
  created_at: string | null;
  updated_at: string | null;
  projects_count: number;
}

export interface AdminUserDetail {
  profile: AdminUser;
  projects: AdminProject[];
  activity: AdminActivityEvent[];
}

export interface AdminProject {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  url: string | null;
  screenshot_url: string | null;
  status: string | null;
  progress_score: number | null;
  valuation_low: number | null;
  valuation_high: number | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export interface AdminRedemption {
  id: string;
  user_id: string;
  amount: number;
  reward_type: string;
  status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  fulfilled_at: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export interface AdminAnalyticsEvent {
  id: string;
  user_id: string | null;
  project_id: string | null;
  event_name: string;
  properties: Record<string, unknown> | null;
  created_at: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

export interface AdminActivityEvent {
  id: string;
  user_id: string;
  project_id: string;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}
