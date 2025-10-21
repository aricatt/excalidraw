import type { ColorSpan, StyleSpan } from "./types";

export interface ParsedText {
  cleanText: string;
  colorSpans: ColorSpan[];
  styleSpans: StyleSpan[];
}

/**
 * 验证十六进制颜色值是否有效
 */
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * 解析包含样式标记的文本
 * 支持格式: <color=#FF6B35>文字</color>, <b>粗体</b>, <i>斜体</i>, <u>下划线</u>, <s>删除线</s>
 */
export const parseStyleTags = (text: string): ParsedText => {
  const colorSpans: ColorSpan[] = [];
  const styleSpans: StyleSpan[] = [];
  let cleanText = text;
  let totalOffset = 0;

  // 定义所有支持的标记类型
  const tagPatterns = [
    { regex: /<color=(#[0-9A-Fa-f]{6})>(.*?)<\/color>/g, type: 'color' },
    { regex: /<b>(.*?)<\/b>/g, type: 'bold' },
    { regex: /<i>(.*?)<\/i>/g, type: 'italic' },
    { regex: /<u>(.*?)<\/u>/g, type: 'underline' },
    { regex: /<s>(.*?)<\/s>/g, type: 'strikethrough' },
  ];

  // 收集所有匹配项
  const allMatches: Array<{
    match: RegExpExecArray;
    type: string;
    index: number;
    fullMatch: string;
    content: string;
    colorValue?: string;
  }> = [];

  tagPatterns.forEach(({ regex, type }) => {
    let match;
    regex.lastIndex = 0; // 重置正则表达式状态
    
    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, param, content] = match;
      allMatches.push({
        match,
        type,
        index: match.index,
        fullMatch,
        content: content || param, // 对于颜色标记，content 在第二个参数
        colorValue: type === 'color' ? param : undefined,
      });
    }
  });

  // 按出现位置排序
  allMatches.sort((a, b) => a.index - b.index);

  // 处理每个匹配项
  for (const item of allMatches) {
    const adjustedStart = item.index - totalOffset;
    const adjustedEnd = adjustedStart + item.content.length;

    if (item.type === 'color' && item.colorValue) {
      // 验证颜色值
      if (isValidHexColor(item.colorValue)) {
        colorSpans.push({
          start: adjustedStart,
          end: adjustedEnd,
          color: item.colorValue.toUpperCase(),
        });
      } else {
        console.warn(`Invalid hex color: ${item.colorValue}`);
      }
    } else {
      // 样式标记
      const existingSpan = styleSpans.find(
        span => span.start === adjustedStart && span.end === adjustedEnd
      );

      if (existingSpan) {
        // 合并到现有的样式范围
        switch (item.type) {
          case 'bold':
            existingSpan.bold = true;
            break;
          case 'italic':
            existingSpan.italic = true;
            break;
          case 'underline':
            existingSpan.underline = true;
            break;
          case 'strikethrough':
            existingSpan.strikethrough = true;
            break;
        }
      } else {
        // 创建新的样式范围
        const newSpan: StyleSpan = {
          start: adjustedStart,
          end: adjustedEnd,
        };

        switch (item.type) {
          case 'bold':
            newSpan.bold = true;
            break;
          case 'italic':
            newSpan.italic = true;
            break;
          case 'underline':
            newSpan.underline = true;
            break;
          case 'strikethrough':
            newSpan.strikethrough = true;
            break;
        }

        styleSpans.push(newSpan);
      }
    }

    // 从文本中移除标记，保留内容
    cleanText = cleanText.replace(item.fullMatch, item.content);
    totalOffset += item.fullMatch.length - item.content.length;
  }

  // 按起始位置排序
  colorSpans.sort((a, b) => a.start - b.start);
  styleSpans.sort((a, b) => a.start - b.start);

  return { cleanText, colorSpans, styleSpans };
};

// 保持向后兼容性
export const parseColorTags = parseStyleTags;

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
 * 获取指定字符位置的样式
 */
export const getStyleForCharacter = (
  charIndex: number,
  styleSpans: StyleSpan[],
): StyleSpan | null => {
  for (const span of styleSpans) {
    if (charIndex >= span.start && charIndex < span.end) {
      return span;
    }
  }
  return null;
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
 * 检查文本是否包含样式标记
 */
export const hasStyleTags = (text: string): boolean => {
  return /<(color=#[0-9A-Fa-f]{6}|b|i|u|s)>.*?<\/(color|b|i|u|s)>/.test(text);
};

// 保持向后兼容性
export const hasColorTags = hasStyleTags;
