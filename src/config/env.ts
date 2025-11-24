type EnvKey = 'VITE_API_BASE_URL' | 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY';

interface ReadEnvOptions {
  optional?: boolean;
  defaultValue?: string;
}

interface NormalizeUrlOptions {
  allowRelative?: boolean;
}

const readEnvVar = (key: EnvKey, options: ReadEnvOptions = {}) => {
  const rawValue = import.meta.env[key];
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    if (options.defaultValue !== undefined) {
      return options.defaultValue;
    }
    if (options.optional) {
      return undefined;
    }
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }
  return rawValue.trim();
};

const normalizeUrl = (
  value: string | undefined,
  key: EnvKey,
  options: NormalizeUrlOptions = {}
): string | undefined => {
  if (!value) return undefined;

  if (options.allowRelative && value.startsWith('/')) {
    return value.replace(/\/+$/, '') || '/';
  }

  try {
    const parsed = new URL(value);
    return parsed.toString().replace(/\/+$/, '');
  } catch (error) {
    throw new Error(`[env] Invalid URL provided for ${key}: ${(error as Error).message}`);
  }
};

const apiBaseUrl = normalizeUrl(
  readEnvVar('VITE_API_BASE_URL', { defaultValue: '/api' }),
  'VITE_API_BASE_URL',
  { allowRelative: true }
)!;

const supabaseUrl = normalizeUrl(
  readEnvVar('VITE_SUPABASE_URL', { optional: true }),
  'VITE_SUPABASE_URL'
);

const supabaseAnonKey = readEnvVar('VITE_SUPABASE_ANON_KEY', { optional: true });

export const env = {
  mode: import.meta.env.MODE ?? 'development',
  isDev: Boolean(import.meta.env.DEV),
  isProd: Boolean(import.meta.env.PROD),
  api: {
    baseUrl: apiBaseUrl,
  },
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  },
} as const;

export type AppEnv = typeof env;
