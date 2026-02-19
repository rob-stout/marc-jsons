export interface ColorToken {
  name: string;
  hex: string;
  description: string;
  isDark: boolean;
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  lineHeight: string;
  description: string;
}

export interface SpacingToken {
  name: string;
  value: number;
  description: string;
}

export interface RadiusToken {
  name: string;
  value: number;
  description: string;
}

export interface ShadowToken {
  name: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  description: string;
}

export interface ComponentSpec {
  name: string;
  type: "button" | "chip" | "card" | "input" | "unknown";
  properties: Record<string, string>;
}

export interface SystemMeta {
  name: string;
  version: string;
  tagline: string;
  brandColor: string;
  fonts: string[];
}

export interface DesignSystem {
  meta: SystemMeta;
  colors: ColorToken[];
  darkColors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  radius: RadiusToken[];
  shadows: ShadowToken[];
  components: ComponentSpec[];
}

export function emptyDesignSystem(): DesignSystem {
  return {
    meta: { name: "Design System", version: "", tagline: "", brandColor: "", fonts: [] },
    colors: [],
    darkColors: [],
    typography: [],
    spacing: [],
    radius: [],
    shadows: [],
    components: [],
  };
}
