export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  role?: 'admin' | 'user';
  permissions?: string[];
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
