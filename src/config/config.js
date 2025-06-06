import { createClient } from "@supabase/supabase-js";

//SUPABASE CONFIG
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//APP CONFIG
export const API_URL = import.meta.env.VITE_API_URL;
export const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN;
export const isPaymentEnabled = import.meta.env.VITE_PAYMENT_ENABLED === "true";
export const MIN_ZOOM_LEVEL = import.meta.env.VITE_MINIMUM_ZOOM_FOR_CLICK;
export const ZOOM_FACTOR = import.meta.env.VITE_ZOOM_FACTOR;
export const INERTIA_ZOOM = import.meta.env.VITE_INERTIA_ZOOM;
export const ZOOM_OUT_LEVEL = import.meta.env.VITE_ZOOM_OUT_LEVEL;
export const BUY_CLICKS_PACKAGE_ONE = import.meta.env.VITE_BUY_CLICKS_PACKAGE_ONE;
export const BUY_CLICKS_PACKAGE_TWO = import.meta.env.VITE_BUY_CLICKS_PACKAGE_TWO;
export const BUY_CLICKS_PACKAGE_THREE = import.meta.env.VITE_BUY_CLICKS_PACKAGE_THREE;
export const BUY_CLICKS_PACKAGE_ONE_COST = import.meta.env.VITE_BUY_CLICKS_PACKAGE_ONE_COST;
export const BUY_CLICKS_PACKAGE_TWO_COST = import.meta.env.VITE_BUY_CLICKS_PACKAGE_TWO_COST;
export const BUY_CLICKS_PACKAGE_THREE_COST = import.meta.env.VITE_BUY_CLICKS_PACKAGE_THREE_COST;
export const FREE_CLICKS = import.meta.env.VITE_FREE_CLICKS;


