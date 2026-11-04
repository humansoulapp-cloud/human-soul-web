"use client";

import Script from "next/script";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Product analytics with PostHog, loaded from its official snippet (no npm package).
 * Requests go through /ingest on our own domain (see next.config.ts) so blockers don't drop them.
 *
 * Privacy: journal writing is private, so every input and every piece of on-screen text is
 * masked in session replays and never sent with autocaptured clicks. People are identified
 * only by their account id, never by email or name.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_REGION === "us" ? "https://us.posthog.com" : "https://eu.posthog.com";

type PH = {
  __loaded?: boolean;
  identify: (id: string) => void;
  reset: () => void;
  get_distinct_id?: () => string;
};

declare global {
  interface Window {
    posthog?: PH;
  }
}

const SNIPPET = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);`;

export default function PostHogAnalytics() {
  // Tie events to the account (id only) while someone is signed in; forget it on sign-out.
  useEffect(() => {
    if (!KEY) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id;
      if (id) window.posthog?.identify(id);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") window.posthog?.reset();
      else if (session?.user?.id) window.posthog?.identify(session.user.id);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!KEY) return null;

  const config = {
    ui_host: UI_HOST,
    defaults: "2025-05-24",
    capture_pageview: "history_change",
    capture_pageleave: true,
    person_profiles: "identified_only",
    mask_all_text: true,
    mask_all_element_attributes: true,
    session_recording: { maskAllInputs: true, maskTextSelector: "*" },
  };

  return (
    <Script id="posthog" strategy="afterInteractive">
      {`${SNIPPET}
var c=${JSON.stringify(config)};c.api_host=window.location.origin+"/ingest";
posthog.init(${JSON.stringify(KEY)},c);`}
    </Script>
  );
}
