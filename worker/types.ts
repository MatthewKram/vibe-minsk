export interface Bindings {
  SUPABASE_URL:string; SUPABASE_SECRET_KEY:string; TELEGRAM_BOT_TOKEN:string; TELEGRAM_BOT_USERNAME:string; TELEGRAM_APP_SHORT_NAME:string; APP_URL:string; ALLOW_DEV_AUTH:string; DEV_TELEGRAM_ID?:string; ENVIRONMENT:string; ASSETS:Fetcher;
}
export interface Variables { user?: any; }
export type AppEnv={Bindings:Bindings;Variables:Variables};
