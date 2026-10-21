import type { ReactNode } from "react";
import type { IconName } from "../types";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    brand: (
      <>
        <path d="M12 3.2c-2.8 0-5 2.1-5 4.7 0 1 .3 1.9.8 2.7C5.6 11.3 4 13.3 4 15.8c0 2.8 2.1 5 4.8 5 1.3 0 2.5-.5 3.3-1.4.8.9 2 1.4 3.3 1.4 2.7 0 4.8-2.2 4.8-5 0-2.5-1.6-4.5-3.8-5.2.5-.8.8-1.7.8-2.7 0-2.6-2.3-4.7-5.2-4.7Z" />
        <path d="M12 6.7v9.9M8.7 11.7h6.6" />
      </>
    ),
    home: (
      <>
        <path d="m3.8 10 8.2-6.7 8.2 6.7" />
        <path d="M5.8 9.2v10.2h12.4V9.2M9.7 19.4v-5.8h4.6v5.8" />
      </>
    ),
    visits: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2.2" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 20c.5-3.3 3-5.5 6.5-5.5s6 2.2 6.5 5.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19 13.6a7.8 7.8 0 0 0 0-3.2l2-1.5-2-3.4-2.5 1a8 8 0 0 0-2.7-1.6L13.5 2h-4l-.4 2.9a8 8 0 0 0-2.7 1.6l-2.5-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 3.2l-2 1.5 2 3.4 2.5-1a8 8 0 0 0 2.7 1.6l.4 2.9h4l.4-2.9a8 8 0 0 0 2.7-1.6l2.5 1 2-3.4-2.1-1.5Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5.5v16H10M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
        <path d="M10 21h4" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    chat: (
      <>
        <path d="M20 11.4a7.9 7.9 0 0 1-8.2 7.6 9.1 9.1 0 0 1-3.3-.6L4 20l1.4-4A7.4 7.4 0 0 1 4 11.5 7.9 7.9 0 0 1 12.1 4 7.8 7.8 0 0 1 20 11.4Z" />
        <path d="M8.5 11.5h.1M12 11.5h.1M15.5 11.5h.1" strokeWidth="2.4" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="6" width="13" height="12" rx="2.3" />
        <path d="m16 10 5-3v10l-5-3Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="2.4" />
        <path d="M8 3v4M16 3v4M3.5 10h17" />
        <path d="M8 14h3M8 17h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.2 2" />
      </>
    ),
    arrow: <path d="M5 12h13M14 8l4 4-4 4" />,
    edit: (
      <>
        <path d="M13.5 6.5 17.5 10.5M4 20l3.4-.7L19.2 7.5a2.1 2.1 0 0 0-3-3L4.7 16.1 4 20Z" />
        <path d="M13 5.5 18.5 11" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5.2c0 4.5 2.8 7.8 7 9.8 4.2-2 7-5.3 7-9.8V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" strokeWidth="2.2" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16" />
      </>
    ),
    print: (
      <>
        <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="7" y="14" width="10" height="7" />
      </>
    ),
    care: (
      <>
        <path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.9C19.5 15.6 12 20 12 20Z" />
        <path d="M8.5 12h2l1-2.2 1.3 4.1 1-1.9h1.7" />
      </>
    ),
    pill: (
      <>
        <path d="m8.2 16.8 8.6-8.6a3.5 3.5 0 0 0-5-5l-8.6 8.6a3.5 3.5 0 0 0 5 5Z" />
        <path d="m8 7 5 5" />
      </>
    ),
    test: (
      <>
        <path d="M9 3h6M10 3v5l-5.2 9a2.6 2.6 0 0 0 2.3 4h9.8a2.6 2.6 0 0 0 2.3-4L14 8V3" />
        <path d="M7.5 16h9" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C11 4 5 8.5 5 15c0 2.8 2 5 5 5 6.5 0 10-7 10-16Z" />
        <path d="M4 21c2.5-5 6.5-8 11-10" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4.5" width="14" height="16" rx="2.2" />
        <path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 17h4" />
      </>
    ),
    checkDocument: (
      <>
        <path d="M6 3.5h8l4 4V20H6Z" />
        <path d="M14 3.5V8h4M9 14l2 2 4-4" />
      </>
    ),
    stethoscope: (
      <>
        <path d="M5 3v6a4 4 0 0 0 8 0V3M3 3h4M11 3h4" />
        <path d="M9 13v1.5a4.5 4.5 0 0 0 9 0v-1" />
        <circle cx="18" cy="11" r="2" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 5h16v14H4Z" />
        <path d="m4 13 4-4h8l4 4M4 13h5l1.5 2h3l1.5-2h5" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}
