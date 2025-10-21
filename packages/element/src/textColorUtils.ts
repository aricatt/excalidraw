import type { ColorSpan } from "./types";

export interface ParsedText {
  cleanText: string;
  colorSpans: ColorSpan[];
}

/**
 * 验证十六进制颜色值是否有效
 */
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * 解析包含颜色标记的文本
 * 支持格式: <color=#FF6B35>文字</color>
 */
export const parseColorTags = (text: string): ParsedText => {
  const colorSpans: ColorSpan[] = [];
  let cleanText = text;
  let offset = 0;

  // 匹配 <color=#FFFFFF>content</color> 格式
  const tagRegex = /<color=(#[0-9A-Fa-f]{6})>(.*?)<\/color>/g;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const [fullMatch, colorStr, content] = match;
    const start = match.index - offset;
    const end = start + content.length;

    // 验证颜色值
    if (isValidHexColor(colorStr)) {
      colorSpans.push({
        start,
        end,
        color: colorStr.toUpperCase(),
      });
    } else {
      console.warn(`Invalid hex color: ${colorStr}`);
    }

    // 从文本中移除标记，保留内容
    cleanText = cleanText.replace(fullMatch, content);
    offset += fullMatch.length - content.length;
  }

  // 按起始位置排序
  colorSpans.sort((a, b) => a.start - b.start);

  return { cleanText, colorSpans };
};

/**
 * 获取指定字符位置的颜色
 */
export const getColorForCharacter = (
  charIndex: number,
  colorSpans: ColorSpan[],
  defaultColor: string,
): string => {
  for (const span of colorSpans) {
    if (charIndex >= span.start && charIndex < span.end) {
      return span.color;
    }
  }
  return defaultColor;
};

/**
 * 将 ColorSpan[] 转换回标记文本
 * 用于调试或导出
 */
export const colorSpansToMarkup = (
  text: string,
  colorSpans: ColorSpan[],
): string => {
  if (!colorSpans || colorSpans.length === 0) {
    return text;
  }

  let result = "";
  let lastIndex = 0;

  // 按起始位置排序
  const sortedSpans = [...colorSpans].sort((a, b) => a.start - b.start);

  for (const span of sortedSpans) {
    // 添加标记前的文本
    result += text.slice(lastIndex, span.start);

    // 添加带颜色标记的文本
    const coloredText = text.slice(span.start, span.end);
    result += `<color=${span.color}>${coloredText}</color>`;

    lastIndex = span.end;
  }

  // 添加剩余文本
  result += text.slice(lastIndex);

  return result;
};

/**
 * 检查文本是否包含颜色标记
 */
export const hasColorTags = (text: string): boolean => {
  return /<color=#[0-9A-Fa-f]{6}>.*?<\/color>/.test(text);
};
