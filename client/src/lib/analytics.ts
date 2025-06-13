// Generic analytics utility for TerraFusionTheory client

export type AnalyticsEvent = {
  event: string;
  properties?: Record<string, any>;
};

/**
 * Send analytics event to provider or custom endpoint
 */
export function logAnalyticsEvent(event: string, properties?: Record<string, any>) {
  // Example: send to custom endpoint or analytics provider
  if (window?.gtag) {
    window.gtag('event', event, properties || {});
  } else if (window?.analytics) {
    window.analytics.track(event, properties || {});
  } else {
    // Fallback: log to console
    console.info(`[Analytics]`, event, properties);
  }
}

// Optionally expose on window for global error boundary and manual calls
if (typeof window !== 'undefined') {
  (window as any).logAnalyticsEvent = logAnalyticsEvent;
}
