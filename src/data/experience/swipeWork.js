/* Swipe work, grouped into themes and scrubbed for publication.
   The source repository is private, so nothing here references a pull request:
   no links, no numbers, no titles, and no PR counts. Rows are work areas with
   the period they ran over. The detailed record is kept outside this repo. */
export const swipeCategoryMeta = [
  {
    "key": "migration",
    "icon": "layers",
    "title": "XML → Compose migration",
    "blurb": "The app was legacy XML/Views when I joined. Each flow was rebuilt in Compose against new Figma designs and shipped behind a remote feature flag, so old and new could run side by side in production and traffic could be moved gradually. A flow is rarely a single screen — most span several, plus their sheets and dialogs."
  },
  {
    "key": "legacy",
    "icon": "scissors",
    "title": "Legacy removal",
    "blurb": "The phase people skip. Once a migrated flow was stable, the flag and the XML screens behind it came out. A flag sitting at full rollout for months isn't a safety net — it's an untested branch in every code path. All of this work came after I converted to full-time."
  },
  {
    "key": "arch",
    "icon": "gitBranch",
    "title": "Architecture, build & performance",
    "blurb": "Platform work rather than product work: Gradle convention plugins, centralised navigation arguments, sharply reduced remote-config fetch volume, shared UI components, and removing permissions and network calls the app didn't need."
  },
  {
    "key": "crash",
    "icon": "bug",
    "title": "Crash fixes & reliability",
    "blurb": "Production crashes traced from Crashlytics, plus making the app behave sensibly when things outside it fail — a real server-down state, and letting onboarding proceed when an external government service is unavailable."
  },
  {
    "key": "ai",
    "icon": "activity",
    "title": "AI-assisted features",
    "blurb": "Product integration of the company's AI assistant — generating notes, terms and product descriptions, capturing expenses, letting users set standing instructions, and collecting structured feedback on output quality."
  },
  {
    "key": "feature",
    "icon": "plus",
    "title": "New features & flows",
    "blurb": "The largest category, and the most evenly split between my intern and full-time periods. Concentrated in the document creation flow, tax compliance, the online store, and products and inventory."
  },
  {
    "key": "uifix",
    "icon": "grid",
    "title": "UI & UX fixes",
    "blurb": "Layout, alignment, labels and empty states — including a recurring class of bug where large or small numbers rendered in scientific notation instead of as plain decimals."
  },
  {
    "key": "bugfix",
    "icon": "alert",
    "title": "Bug fixes & correctness",
    "blurb": "My largest category as an intern. Mostly logic rather than layout: totals and discounts, batch and serial-number handling, settings that didn't persist, and tax rules misapplying in specific account configurations."
  }
];

export const swipeWork = {
  "migration": [
    {
      "area": "Settings surfaces",
      "note": "Settings, preferences and company-detail flows rebuilt in Compose"
    },
    {
      "area": "Document building blocks",
      "note": "Shared pieces of the document flow — notes, terms, signature capture"
    },
    {
      "area": "Account, support & analytics",
      "note": "Profile, roles, help content and the analytics dashboard"
    },
    {
      "area": "Product & inventory flows",
      "note": "Product list, create and edit flows"
    },
    {
      "area": "Payments & banking flows",
      "note": "Bank, transfer and payment-recording flows"
    },
    {
      "area": "Expense flows",
      "note": "Expense creation and detail flows"
    },
    {
      "area": "Notifications & system states",
      "note": "In-app notifications and shared empty/maintenance states"
    }
  ],
  "legacy": [
    {
      "area": "Deleting superseded XML screens",
      "note": "Removed the old screens, layouts and adapters once Compose replacements were stable"
    },
    {
      "area": "Retiring migration feature flags",
      "note": "Deleted migration flags sitting at full rollout, and the dead branch behind each"
    }
  ],
  "arch": [
    {
      "area": "Backend API migration",
      "note": "Moved flows onto newer backend endpoints and dropped unused response fields"
    },
    {
      "area": "Remote Config optimisation",
      "note": "Cut fetch volume with a longer interval plus realtime updates; moved static copy into config"
    },
    {
      "area": "Shared UI components",
      "note": "Reusable text field, dial-code picker, warning dialog and back-to-top control"
    },
    {
      "area": "App hygiene & housekeeping",
      "note": "Removed unneeded permissions and redundant network calls; centralised preference access"
    },
    {
      "area": "Build tooling & module boilerplate",
      "note": "Gradle convention plugins and centralised navigation arguments — ~80% less per-module boilerplate"
    }
  ],
  "crash": [
    {
      "area": "Crashlytics-surfaced crash fixes",
      "note": "Production crashes traced from Crashlytics — unguarded division, missing fields, unescaped characters"
    },
    {
      "area": "Graceful degradation on backend failure",
      "note": "A proper server-down state, and letting onboarding continue when an external service is unavailable"
    },
    {
      "area": "Concurrency & uninitialised state guards",
      "note": "Refusing to create documents from incomplete state; fixing collisions when two devices act at once"
    }
  ],
  "ai": [
    {
      "area": "AI generation in document flows",
      "note": "AI-assisted notes, terms and product descriptions inside document creation"
    },
    {
      "area": "Output feedback & controls",
      "note": "Copy controls and structured, reason-based feedback on AI responses"
    },
    {
      "area": "AI expense capture",
      "note": "Creating an expense from AI-extracted detail"
    },
    {
      "area": "User-level AI configuration",
      "note": "User-defined standing instructions that shape AI output"
    }
  ],
  "feature": [
    {
      "area": "Document creation & editing",
      "note": "The app's core flow — line items, discounts, currencies, serial numbers, barcode scanning, PDF options"
    },
    {
      "area": "Compliance: GST, E-way bill & E-invoice",
      "note": "Indian tax compliance — validations, mandatory fields and generation from the invoice flow"
    },
    {
      "area": "Online store & coupons",
      "note": "Storefront settings, order detail and activity, coupon creation and listing"
    },
    {
      "area": "Products & inventory",
      "note": "Product listing, categorisation, batches and stock visibility"
    },
    {
      "area": "Copy, labels & interaction polish",
      "note": "Wording, labels and small interaction changes across the app"
    },
    {
      "area": "Payments & banking",
      "note": "Recording payments, payment history and bank detail handling"
    },
    {
      "area": "Onboarding, dashboard & activation",
      "note": "New-user onboarding, dashboard prompts and deep-link handling"
    },
    {
      "area": "Settings, search & navigation",
      "note": "In-app search, section navigation, export and print settings"
    },
    {
      "area": "Custom fields & headers",
      "note": "A single hub for user-defined fields, with active and inactive sections"
    },
    {
      "area": "Expenses",
      "note": "Expense listing, search and category management"
    },
    {
      "area": "Plan gating & permissions",
      "note": "Gating paid features and respecting per-user permissions on both read and write paths"
    }
  ],
  "uifix": [
    {
      "area": "Layout & alignment",
      "note": "Spacing, alignment and scroll behaviour defects"
    },
    {
      "area": "Number & value display",
      "note": "Large and small values rendering in scientific notation instead of plain decimals"
    },
    {
      "area": "Labels, icons & empty states",
      "note": "Wrong labels, missing icons and empty-state handling"
    }
  ],
  "bugfix": [
    {
      "area": "Document & line-item correctness",
      "note": "Totals, discounts, dates and line-item state in the document flow"
    },
    {
      "area": "Products, batches & serial numbers",
      "note": "Selection, quantity, batch and serial-number handling"
    },
    {
      "area": "Payments & banking",
      "note": "Recording payments, payment history and bank detail handling"
    },
    {
      "area": "Settings & preferences persistence",
      "note": "Settings not saving, or not applying to the right account tier"
    },
    {
      "area": "Parties, addresses & contacts",
      "note": "Customer and vendor detail, address selection and contact import"
    },
    {
      "area": "Tax & compliance logic",
      "note": "Tax not applying correctly in specific document and account configurations"
    }
  ]
};
