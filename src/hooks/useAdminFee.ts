import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ADMIN_FEE = 10; // fallback if DB fetch fails
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let cachedFee: Float | null = null;
let cachedAt: number | null = null;

/**
 * Fetches the admin fee percentage from system_settings.
 * Caches the result for 5 minutes to reduce DB hits.
 */
export const fetchAdminFeePercentage = async (): Promise<number> => {
  // Return cached value if still valid
  if (
    cachedFee !== null &&
    cachedAt &&
    Date.now() - cachedAt < CACHE_DURATION_MS
  ) {
    return cachedFee;
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "admin_fee_percentage")
      .single();

    if (error || !data) {
      console.warn("Failed to fetch admin fee, using default:", error);
      return DEFAULT_ADMIN_FEE;
    }

    // cachedFee = Number(data.value);
    const parsed = parseFloat(data.value);

    if (isNaN(parsed)) {
      console.warn("Invalid admin fee value, using default:", data.value);
      cachedFee = DEFAULT_ADMIN_FEE;
    } else {
      cachedFee = parsed;
    }
    cachedAt = Date.now();
    return cachedFee;
  } catch (err) {
    console.error("Error fetching admin fee:", err);
    return DEFAULT_ADMIN_FEE;
  }
};

/**
 * Invalidates the cached admin fee (call after admin updates the fee)
 */
export const invalidateAdminFeeCache = () => {
  cachedFee = null;
  cachedAt = null;
};

/**
 * React hook for using the admin fee percentage.
 * Returns { feePercentage, loading, error, refetch }
 */
export const useAdminFee = () => {
  const [feePercentage, setFeePercentage] = useState<number>(DEFAULT_ADMIN_FEE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const fee = await fetchAdminFeePercentage();
      setFeePercentage(fee);
    } catch (err: any) {
      setError(err.message || "Failed to fetch admin fee");
      setFeePercentage(DEFAULT_ADMIN_FEE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return {
    feePercentage,
    feeDecimal: feePercentage / 100,
    loading,
    error,
    refetch: () => {
      invalidateAdminFeeCache();
      fetch();
    },
  };
};

/**
 * Calculate fee breakdown given a gross amount and fee percentage.
 */
export const calculateFeeBreakdown = (
  grossAmount: number,
  feePercentage: number,
) => {
  const safeGross = Number(grossAmount) || 0;
  const safeFeePercent = Number(feePercentage) || 0;

  const fee = (safeGross * safeFeePercent) / 100;
  const payout = safeGross - fee;
  return { grossAmount: safeGross, fee, payout, feePercentage: safeFeePercent };
};
