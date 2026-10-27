import { Platform } from 'react-native';
import posthog from 'posthog-js';

const POSTHOG_API_KEY = 'phc_D5tFaypWHQsrFDXoUTQLWmC8RpbuVpqHQ7qjZwoLm9QC';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let isInitialized = false;

export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Lifeline | Unified Healthcare & Emergency Dispatch',
  '/emergency': 'Lifeline | Emergency Assistance & SOS Dispatch',
  '/symptoms': 'Lifeline | AI Symptoms Checker & Triage',
  '/doctor': 'Lifeline | Verified Doctors & Consultations',
  '/medicine': 'Lifeline | 24/7 Pharmacy & Medicine Store',
  '/history': 'Lifeline | Medical Vault & Health Records',
  '/profile': 'Lifeline | User Profile & Medical Settings',
  '/onboarding': 'Lifeline | Medical Onboarding',
};

/**
 * Initializes PostHog analytics for web clients.
 */
export const initPostHog = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || isInitialized) {
    return;
  }

  try {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // Explicitly manual to capture SPA client navigation & descriptive page titles
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: true,
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[PostHog] Init error:', err);
  }
};

/**
 * Tracks route navigation as a $pageview event in PostHog with title and URL.
 */
export const trackPageView = (pathname: string) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  if (!isInitialized) {
    initPostHog();
  }

  const title = ROUTE_TITLES[pathname] || `Lifeline | ${pathname.replace('/', '') || 'Home'}`;

  if (typeof document !== 'undefined') {
    document.title = title;
  }

  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: pathname,
      title: title,
      path: pathname,
    });
  } catch (err) {
    console.warn('[PostHog] Pageview capture error:', err);
  }
};

export default posthog;

