import React from 'react';
import { CellStyle, CellBorders, CellBorderSide } from '../types';

const THEME_PALETTE = [
  '#FFFFFF', // 0: Light 1
  '#000000', // 1: Dark 1
  '#E7E6E6', // 2: Light 2
  '#44546A', // 3: Dark 2
  '#4472C4', // 4: Accent 1 (Blue)
  '#ED7D31', // 5: Accent 2 (Orange)
  '#A5A5A5', // 6: Accent 3 (Gray)
  '#FFC000', // 7: Accent 4 (Gold)
  '#5B9BD5', // 8: Accent 5 (Light Blue)
  '#70AD47', // 9: Accent 6 (Green)
];

/**
 * Applies tint factor (-1.0 to 1.0) to a hex color string
 */
export function applyTint(hex: string, tint?: number): string {
  if (tint === undefined || tint === 0) return hex;
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  } else if (tint < 0) {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  }

  const toHex = (val: number) => Math.min(255, Math.max(0, val)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extracts and converts Excel color object (ARGB or Theme + Tint) into CSS hex or rgba string
 */
export function parseExcelColor(color: any): string | undefined {
  if (!color || typeof color !== 'object') return undefined;

  // 1. ARGB Hex representation (e.g. "FFFF0000" or "1E293B")
  if (typeof color.argb === 'string') {
    const raw = color.argb.trim();
    if (raw.length === 8) {
      const a = parseInt(raw.slice(0, 2), 16) / 255;
      const r = parseInt(raw.slice(2, 4), 16);
      const g = parseInt(raw.slice(4, 6), 16);
      const b = parseInt(raw.slice(6, 8), 16);

      // In some Excel versions, alpha 00 means default or black
      if (a === 0 && raw === '00000000') {
        return undefined;
      }
      if (a < 0.99) {
        return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})`;
      }
      return `#${raw.slice(2).toLowerCase()}`;
    }
    if (raw.length === 6) {
      return `#${raw.toLowerCase()}`;
    }
  }

  // 2. Theme color index (0-9) with optional tint
  if (typeof color.theme === 'number' && color.theme >= 0 && color.theme < THEME_PALETTE.length) {
    const baseHex = THEME_PALETTE[color.theme];
    return applyTint(baseHex, color.tint);
  }

  return undefined;
}

/**
 * Normalizes Excel border style to CSS border style string
 */
function normalizeBorderStyle(style: string | undefined): { width: string; type: string } {
  if (!style) return { width: '1px', type: 'solid' };

  switch (style) {
    case 'medium':
      return { width: '2px', type: 'solid' };
    case 'thick':
      return { width: '3px', type: 'solid' };
    case 'double':
      return { width: '3px', type: 'double' };
    case 'hair':
    case 'dotted':
    case 'dashDotDot':
    case 'mediumDashDotDot':
      return { width: '1px', type: 'dotted' };
    case 'dashed':
    case 'mediumDashed':
    case 'dashDot':
    case 'mediumDashDot':
    case 'slantDashDot':
      return { width: '1px', type: 'dashed' };
    case 'thin':
    default:
      return { width: '1px', type: 'solid' };
  }
}

/**
 * Parses border side (top, right, bottom, left)
 */
function parseBorderSide(side: any): CellBorderSide | undefined {
  if (!side || typeof side !== 'object') return undefined;
  if (!side.style) return undefined;

  const styleMap: Record<string, CellBorderSide['style']> = {
    thin: 'thin',
    medium: 'medium',
    thick: 'thick',
    double: 'double',
    dashed: 'dashed',
    dotted: 'dotted',
    hair: 'dotted',
  };

  const normStyle = styleMap[side.style] || 'thin';
  const color = parseExcelColor(side.color) || '#94a3b8';

  return {
    style: normStyle,
    color,
  };
}

/**
 * Extracts complete CellStyle from an ExcelJS Cell
 */
export function extractExcelJsCellStyle(cell: any): CellStyle | null {
  if (!cell) return null;

  let hasAny = false;
  const style: CellStyle = {};

  // 1. Font properties
  if (cell.font) {
    if (typeof cell.font.size === 'number' && cell.font.size > 0) {
      style.fontSize = Math.round(cell.font.size);
      hasAny = true;
    }
    if (cell.font.name) {
      style.fontName = cell.font.name;
    }
    if (cell.font.bold) {
      style.bold = true;
      hasAny = true;
    }
    if (cell.font.italic) {
      style.italic = true;
      hasAny = true;
    }
    if (cell.font.underline) {
      style.underline = true;
      hasAny = true;
    }
    if (cell.font.strike) {
      style.strike = true;
      hasAny = true;
    }

    const fontColor = parseExcelColor(cell.font.color);
    if (fontColor) {
      style.color = fontColor;
      hasAny = true;
    }
  }

  // 2. Cell Fill / Background color
  if (cell.fill && cell.fill.type === 'pattern') {
    const bgColor = parseExcelColor(cell.fill.fgColor) || parseExcelColor(cell.fill.bgColor);
    // Ignore pure white default background if not explicitly styled
    if (bgColor && bgColor.toLowerCase() !== '#ffffff' && bgColor.toLowerCase() !== '#fff') {
      style.backgroundColor = bgColor;
      hasAny = true;
    }
  }

  // 3. Borders
  if (cell.border) {
    const top = parseBorderSide(cell.border.top);
    const right = parseBorderSide(cell.border.right);
    const bottom = parseBorderSide(cell.border.bottom);
    const left = parseBorderSide(cell.border.left);

    if (top || right || bottom || left) {
      style.borders = { top, right, bottom, left };
      hasAny = true;
    }
  }

  // 4. Alignment
  if (cell.alignment) {
    if (['left', 'center', 'right', 'justify'].includes(cell.alignment.horizontal)) {
      style.horizontalAlign = cell.alignment.horizontal;
      hasAny = true;
    }
    if (['top', 'middle', 'bottom'].includes(cell.alignment.vertical)) {
      style.verticalAlign = cell.alignment.vertical;
      hasAny = true;
    }
    if (cell.alignment.wrapText) {
      style.wrapText = true;
      hasAny = true;
    }
  }

  return hasAny ? style : null;
}

/**
 * Converts CellStyle object to React.CSSProperties for inline grid cell rendering
 */
export function cellStyleToCss(
  style: CellStyle | null | undefined,
  options?: { isRowHighlighted?: boolean; isSelected?: boolean }
): React.CSSProperties {
  if (!style) return {};

  const css: React.CSSProperties = {};

  // Font size
  if (style.fontSize) {
    css.fontSize = `${style.fontSize}pt`;
  }

  // Font family
  if (style.fontName) {
    css.fontFamily = `"${style.fontName}", system-ui, sans-serif`;
  }

  // Bold & Italic
  if (style.bold) {
    css.fontWeight = 700;
  }
  if (style.italic) {
    css.fontStyle = 'italic';
  }

  // Underline / Strikethrough
  if (style.underline && style.strike) {
    css.textDecoration = 'underline line-through';
  } else if (style.underline) {
    css.textDecoration = 'underline';
  } else if (style.strike) {
    css.textDecoration = 'line-through';
  }

  // Text Color
  if (style.color) {
    css.color = style.color;
  }

  // Background Color (respect row highlights if cell doesn't have custom background)
  if (style.backgroundColor && !options?.isSelected) {
    css.backgroundColor = style.backgroundColor;
  }

  // Borders
  if (style.borders) {
    if (style.borders.top?.style) {
      const { width, type } = normalizeBorderStyle(style.borders.top.style);
      css.borderTop = `${width} ${type} ${style.borders.top.color || '#94a3b8'}`;
    }
    if (style.borders.right?.style) {
      const { width, type } = normalizeBorderStyle(style.borders.right.style);
      css.borderRight = `${width} ${type} ${style.borders.right.color || '#94a3b8'}`;
    }
    if (style.borders.bottom?.style) {
      const { width, type } = normalizeBorderStyle(style.borders.bottom.style);
      css.borderBottom = `${width} ${type} ${style.borders.bottom.color || '#94a3b8'}`;
    }
    if (style.borders.left?.style) {
      const { width, type } = normalizeBorderStyle(style.borders.left.style);
      css.borderLeft = `${width} ${type} ${style.borders.left.color || '#94a3b8'}`;
    }
  }

  // Text Alignment
  if (style.horizontalAlign) {
    css.textAlign = style.horizontalAlign;
  }
  if (style.verticalAlign) {
    css.verticalAlign = style.verticalAlign;
  }
  if (style.wrapText) {
    css.whiteSpace = 'normal';
    css.wordBreak = 'break-word';
  }

  return css;
}
