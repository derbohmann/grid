import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  BookOpen,
  Box,
  Boxes,
  Camera,
  Cloud,
  Cog,
  Cpu,
  Database,
  Disc,
  FileText,
  Folder,
  Globe,
  HardDrive,
  Heart,
  Home,
  Key,
  Layers,
  Lightbulb,
  Lock,
  Mail,
  Monitor,
  Music,
  Network,
  Package,
  Plug,
  Router,
  Search,
  Server,
  Settings,
  Shield,
  Smartphone,
  Star,
  ThermometerSun,
  User,
  Users,
  Video,
  Wifi,
  Zap,
} from 'lucide-react';

/** Curated Lucide icons for admin picker; stored as `lucide:ExportName`. */
export const LUCIDE_ICON_REGISTRY: Record<string, LucideIcon> = {
  Activity,
  Bell,
  BookOpen,
  Box,
  Boxes,
  Camera,
  Cloud,
  Cpu,
  Cog,
  Database,
  Disc,
  FileText,
  Folder,
  Globe,
  HardDrive,
  Heart,
  Home,
  Key,
  Layers,
  Lightbulb,
  Lock,
  Mail,
  Monitor,
  Music,
  Network,
  Package,
  Plug,
  Router,
  Search,
  Server,
  Settings,
  Shield,
  Smartphone,
  Star,
  ThermometerSun,
  User,
  Users,
  Video,
  Wifi,
  Zap,
};

export type LucideIconOption = { name: string; Icon: LucideIcon };

export const LUCIDE_ICON_OPTIONS: LucideIconOption[] = Object.entries(LUCIDE_ICON_REGISTRY).map(([name, Icon]) => ({ name, Icon }));

export function lucideIconStoredValue(name: string) {
  return `lucide:${name}`;
}

export function parseLucideStoredValue(icon: string | null | undefined): string | null {
  if (!icon?.startsWith('lucide:')) {
    return null;
  }
  const name = icon.slice('lucide:'.length);
  return LUCIDE_ICON_REGISTRY[name] ? name : null;
}
