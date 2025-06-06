import { createClient } from "@supabase/supabase-js";

// ==================== CONFIG ====================
const API_URL = import.meta.env.VITE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN;
const isPaymentEnabled = import.meta.env.VITE_PAYMENT_ENABLED === "true";
const MIN_ZOOM_LEVEL = import.meta.env.VITE_MINIMUM_ZOOM_FOR_CLICK;
const ZOOM_FACTOR = import.meta.env.VITE_ZOOM_FACTOR;
const INERTIA_ZOOM = import.meta.env.VITE_INERTIA_ZOOM;
const ZOOM_OUT_LEVEL = import.meta.env.VITE_ZOOM_OUT_LEVEL;
const BUY_CLICKS_PACKAGE_ONE = import.meta.env.VITE_BUY_CLICKS_PACKAGE_ONE;
const BUY_CLICKS_PACKAGE_TWO = import.meta.env.VITE_BUY_CLICKS_PACKAGE_TWO;
const BUY_CLICKS_PACKAGE_THREE = import.meta.env.VITE_BUY_CLICKS_PACKAGE_THREE;
const BUY_CLICKS_PACKAGE_ONE_COST = import.meta.env.VITE_BUY_CLICKS_PACKAGE_ONE_COST;
const BUY_CLICKS_PACKAGE_TWO_COST = import.meta.env.VITE_BUY_CLICKS_PACKAGE_TWO_COST;
const BUY_CLICKS_PACKAGE_THREE_COST = import.meta.env.VITE_BUY_CLICKS_PACKAGE_THREE_COST;
const FREE_CLICKS = import.meta.env.VITE_FREE_CLICKS;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);