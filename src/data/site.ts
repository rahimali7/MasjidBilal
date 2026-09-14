/**
 * Central site configuration.
 *
 * Everything a non-developer is likely to change lives in this folder.
 * Items marked NEEDS-CONFIRMATION were taken from the Base44 demo
 * screenshots and have NOT been verified with the masjid — check them
 * before the site goes live.
 */

export const site = {
  name: "Masjid Bilal Islamic Center",
  shortName: "Masjid Bilal",
  tagline: "Serving Louisville with faith, knowledge, and compassion.",
  description:
    "Masjid Bilal Islamic Center serves the Muslim community of Louisville, Kentucky with daily prayers, Qur'anic education, youth programs, and community services. Open 24 hours a day.",
  // TODO: replace with the real production domain once it is pointed at the site.
  url: "https://bilalislamiccenter.org",
  locale: "en-US",
  city: "Louisville",
  region: "KY",
  regionName: "Kentucky",
  country: "US",
  founded: 2013,
} as const;

export const contact = {
  email: "masjidbilaal2022@gmail.com",
  /**
   * Confirmed by the masjid as the public number. It is the same number
   * used for Zelle donations, so keep the two in sync if it ever changes
   * (the Zelle copy is in `donations.zelle` below).
   */
  phone: "+1 (502) 457-9902",
  phoneHref: "tel:+15024579902",
  hours: "Open 24 hours, every day",
} as const;

export const donations = {
  zelle: {
    label: "Zelle",
    phone: "(502) 457-9902",
    /** Digits only — used for the copy-to-clipboard button. */
    raw: "5024579902",
    recipientName: "Masjid Bilal Islamic Center",
  },
  /**
   * MOHID's website-integration feed, which carries the masjid's donation
   * categories and the hosted donation link for each.
   *
   * Read server-side by /api/donations. Categories are NOT hard-coded here on
   * purpose: change a fund in MOHID and the website follows, with no code
   * change and no second place to keep in step.
   */
  integrationUrl:
    "https://us.mohid.co/ky/louisville/masjidbilalsouthside/masjid/widget/api/index/?m=websiteintegration/json",

  /**
   * Methods not yet available.
   *
   * Only listed when online giving is unavailable — claiming "card coming
   * soon" directly beneath a working online donation button reads as an error.
   * Whether MOHID's hosted page accepts Apple Pay is NOT confirmed, so this
   * makes no claim either way.
   */
  comingSoon: ["Credit / debit card", "Apple Pay", "Bank transfer (ACH)"],
  /**
   * NEEDS-CONFIRMATION: do not advertise tax-deductible receipts until the
   * masjid's 501(c)(3) determination letter and EIN are confirmed.
   */
  taxDeductible: null as null | { ein: string },
} as const;

export type Location = {
  slug: string;
  name: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  established: number;
  blurb: string;
};

/**
 * The masjid the site directs visitors to.
 *
 * Masjid Bilal West (1701 Dumesnil Street, Louisville, KY 40210, est. 2013)
 * is deliberately NOT listed here. It is still part of the community's story
 * and appears in the history timeline on the About page — see
 * src/data/timeline.ts — but the site sends people to the South Side centre
 * only. Add it back to this array if that ever changes.
 */
export const locations: Location[] = [
  {
    slug: "south-side",
    name: "Masjid Bilal South Side",
    street: "6200 S 3rd Street",
    city: "Louisville",
    region: "KY",
    postalCode: "40214",
    established: 2021,
    blurb:
      "Open around the clock for the five daily prayers, Jumu'ah, Qur'anic education, and anyone who needs a place to go.",
  },
];

/** Convenience for the many places that just want the one address. */
export const primaryLocation: Location = locations[0];

/** The masjid's WhatsApp community group. */
export const whatsapp = {
  groupName: "Masjid Bilal Southside",
  inviteUrl:
    "https://chat.whatsapp.com/JvfajXfKlYD5utT5pVC54r?s=cl&p=i&mlu=4&ilr=4",
  /** Cropped from the invite QR supplied by the masjid. */
  qrImage: "/img/whatsapp-qr.jpg",
} as const;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Prayer Times", href: "/prayer-times" },
  { label: "Programs", href: "/programs" },
  { label: "Events", href: "/events" },
  { label: "Leadership", href: "/leadership" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const footerServices: NavItem[] = [
  { label: "Nikah Services", href: "/contact#nikah" },
  { label: "Funeral & Janazah", href: "/contact#janazah" },
  { label: "Shahada & New Muslims", href: "/contact#shahada" },
  { label: "Community Counseling", href: "/contact#counseling" },
];

/** TODO: add real social profiles, or delete the ones that do not exist. */
export const social: NavItem[] = [];
