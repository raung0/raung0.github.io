export interface LinkItem {
  label: string;
  href: string;
}

export interface FooterItem {
  label: string;
  href?: string;
}

export interface DateFormat {
  locale: string;
  options: Intl.DateTimeFormatOptions;
  template: string;
}

// Site-wide configuration.
export const SITE_TITLE = "Radu's little blog";
export const SITE_DESCRIPTION = "My little place on the internet :^)";
export const SITE_URL = "https://raung0.github.io/";
export const SITE_LANG = "en";

export const DATE_FORMAT: DateFormat = {
  locale: "en-GB",
  options: { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" },
  template: "{day} {month}, {year}",
};

export const SITE_FAVICON = "/favicon.svg";
// Optional stylesheet in public/, e.g. "/custom.css".
export const CUSTOM_STYLESHEET: string | undefined = undefined;

// Add navigation and footer links here without editing components.
export const NAV_ITEMS: LinkItem[] = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog/" },
  { label: "GitHub", href: "https://github.com/raung0" },
];
export const FOOTER_ITEMS: FooterItem[] = [
  // { label: "Made with" },
  // {
  //   label: "Astro ʕ•ᴥ•ʔ Bear",
  //   href: "https://github.com/harleyjwilson/astro-bearblog",
  // },
];
