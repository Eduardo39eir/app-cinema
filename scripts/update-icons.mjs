// Selected Iconsax Free icons integrated into Cine, from the official Vuesax repository.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const revision = "e5dba15361f69d34d0f3f3f35408a28fe74c5727";
const names = {
  ArrowLeft: "arrow-left",
  ArrowRight: "arrow-right",
  Check: "tick-circle",
  Film: "video-play",
  Plus: "add",
  Star: "star-1",
  X: "close-circle",
  ChevronRight: "arrow-right-1",
  ChevronLeft: "arrow-left-1",
  Bookmark: "archive-book",
  Search: "search-normal-1",
  Compass: "discover",
  Home: "home-2",
  Ticket: "ticket",
  UserRound: "user",
  Users: "people",
  CalendarDays: "calendar",
  Download: "document-download",
  Expand: "maximize-4",
  List: "task",
  MapPin: "location",
  Minus: "minus",
  Bell: "notification",
  Heart: "heart",
  SlidersHorizontal: "setting-4",
  Sparkles: "magic-star",
  Eye: "eye",
  ListPlus: "task-square",
  Play: "play",
  Trash2: "trash",
  Grid2X2: "element-4",
  ImagePlus: "gallery-add",
  Lock: "lock",
  Pencil: "edit-2",
  Settings: "setting-2",
  Share2: "share",
  MessageCircle: "message",
  Send: "send-2",
  Wifi: "wifi",
  Battery: "battery-full",
};
const bold = new Set([
  "Star",
  "Bookmark",
  "Heart",
  "Home",
  "Compass",
  "Ticket",
  "Users",
  "UserRound",
  "Play",
  "Battery",
]);
const tree = JSON.parse(
  (await readFile(".reference/iconsax-tree.json", "utf8")).replace(
    /^\uFEFF/,
    "",
  ),
);
function jsx(svg) {
  if (/<script|<foreignObject|on\w+=/i.test(svg)) throw Error("Unexpected SVG");
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replace(/(stroke|fill)="#[0-9a-f]+"/gi, '$1="currentColor"')
    .replace(/([a-z]+)-([a-z])/g, (_, a, b) => a + b.toUpperCase());
}
async function fetchIcon(name, style) {
  const path = `docs/Iconsax/Svg/All/${style}/${name}.svg`;
  if (!tree.tree.some((x) => x.path === path)) throw Error(`Missing ${path}`);
  const { stdout } = await run("curl.exe", [
    "-fsSL",
    "--retry",
    "2",
    "--max-time",
    "25",
    `https://raw.githubusercontent.com/lusaxweb/iconsax/${revision}/${path}`,
  ]);
  return jsx(stdout);
}
let source = `// Iconsax Free — https://iconsax.io — © Iconsax / Vuesax.
// Integrated icons only; original source and license notice: ICONSAX-NOTICE.md.
import type { SVGProps, ReactNode } from 'react';
type IconProps = SVGProps<SVGSVGElement> & {size?: number | string; variant?: 'Linear' | 'Bold'};
function icon(name: string, linear: ReactNode, bold?: ReactNode) {
  return function Icon({size=24, fill, variant, strokeWidth: _strokeWidth, ...props}: IconProps) {
    const filled = variant === 'Bold' || (fill !== undefined && fill !== 'none');
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" data-iconsax={name} {...props}>{filled && bold ? bold : linear}</svg>;
  };
}
`;
const entries = Object.entries(names);
for (let i = 0; i < entries.length; i += 6) {
  const chunk = await Promise.all(
    entries.slice(i, i + 6).map(async ([key, name]) => {
      const linear = await fetchIcon(name, "linear");
      const solid = bold.has(key) ? await fetchIcon(name, "bold") : null;
      return `export const ${key} = icon('${name}', <>${linear}</>${solid ? `, <>${solid}</>` : ""});\n`;
    }),
  );
  source += chunk.join("");
}
await writeFile("src/icons.tsx", source);
for (const file of await readdir("src")) {
  if (!file.endsWith(".tsx")) continue;
  const path = `src/${file}`;
  const content = await readFile(path, "utf8");
  if (content.includes('"lucide-react"'))
    await writeFile(path, content.replaceAll('"lucide-react"', '"./icons"'));
}
console.log(`Integrated ${entries.length} Iconsax icons.`);
