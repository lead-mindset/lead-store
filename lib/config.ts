// Store settings. Values marked TODO are placeholders from the design: confirm them before launch.
export const storeConfig = {
  currency: "USD",
  locale: { en: "en-US", es: "es-US" },
  /** Units from which group pricing applies. TODO: confirm. */
  minGroupQty: 12,
  /** Group discount applied at or above minGroupQty. TODO: confirm. */
  groupDiscountRate: 0.1,
  /** One-time custom print setup fee per order with custom items. TODO: confirm. */
  customSetupFee: 25,
  /** Shipping prices. TODO: confirm. */
  shipping: { standard: 6.95, express: 14.95 },
  /** Estimated sales tax rate applied at checkout. TODO: confirm. */
  taxRate: 0.0825,
  /** Delivery times, in business days. TODO: confirm. */
  days: { standard: "3–5", express: "1–2", production: "5–7", pickupReady: "3", exchange: "30", reply: "2" },
  /** Responses goal for a new chapter group order. */
  groupGoal: 20,
  maxCustomText: 18,
  /** Impact numbers shown on Home and Our impact. TODO: replace with real figures. */
  impact: { students: "[XX]", events: "[XX]", chapters: "[XX]", raised: "[$XX]" },
  /** Shares of proceeds for the "Where your money goes" bars. TODO: replace with real shares. */
  uses: [
    { id: "events", share: 40 },
    { id: "programs", share: 30 },
    { id: "chapters", share: 20 },
    { id: "ops", share: 10 },
  ],
  links: {
    // Same destinations as the main LEAD site (lead-main header and footer).
    site: "https://leadmindset.org",
    about: "https://leadmindset.org/about-us",
    getInvolved: "https://leadmindset.org/get-involved",
    talent: "https://talent.leadmindset.org",
    linkedin: "https://www.linkedin.com/company/leadmindsetorg/",
    instagram: "https://www.instagram.com/lead_americas/",
    contactEmail: "mailto:culture@leadmindset.org",
    partnerEmail: "mailto:contact@leadmindset.org",
  },
} as const;
