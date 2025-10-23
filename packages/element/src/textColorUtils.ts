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
 * 解析包含样式标记的文本，支持嵌套标签
 * 支持格式: <c=#FF6B35>文字</c>, <b>粗体</b>, <i>斜体</i>, <u>下划线</u>, <s>删除线</s>
 * 支持嵌套: <i><b>粗体斜体</b>普通斜体</i>
 * 注意: 同时支持 <color=#FF6B35>文字</color> 语法以保持向后兼容
 */
export const parseStyleTags = (text: string): ParsedText => {
  const colorSpans: ColorSpan[] = [];
  const styleSpans: StyleSpan[] = [];

  // 递归解析函数
  const parseRecursive = (
    input: string,
    baseOffset: number = 0,
    inheritedStyles: Partial<StyleSpan> = {},
  ): string => {
    const result = input;

    // 定义标签模式，按优先级排序（从外到内）
    const tagPatterns = [
      { regex: /<c=(#[0-9A-Fa-f]{6})>(.*?)<\/c>/s, type: "color" },
      { regex: /<color=(#[0-9A-Fa-f]{6})>(.*?)<\/color>/s, type: "color" },
      { regex: /<b>(.*?)<\/b>/s, type: "bold" },
      { regex: /<i>(.*?)<\/i>/s, type: "italic" },
      { regex: /<u>(.*?)<\/u>/s, type: "underline" },
      { regex: /<s>(.*?)<\/s>/s, type: "strikethrough" },
    ];

    // 查找第一个匹配的标签
    let earliestMatch: {
      match: RegExpExecArray;
      type: string;
      index: number;
      colorValue?: string;
    } | null = null;

    for (const { regex, type } of tagPatterns) {
      regex.lastIndex = 0;
      const match = regex.exec(result);
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = {
          match,
          type,
          index: match.index,
          colorValue: type === "color" ? match[1] : undefined,
        };
      }
    }

    // 如果没有找到标签，返回原文本
    if (!earliestMatch) {
      return result;
    }

    const { match, type, colorValue } = earliestMatch;
    const [fullMatch] = match;

    // 根据标签类型获取正确的内容
    const content = type === "color" ? match[2] : match[1];

    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    // 处理匹配前的文本
    const beforeText = result.slice(0, matchStart);
    const afterText = result.slice(matchEnd);

    // 递归处理标签内容，传递继承的样式
    const newInheritedStyles = { ...inheritedStyles };
    if (type === "bold") {
      newInheritedStyles.bold = true;
    }
    if (type === "italic") {
      newInheritedStyles.italic = true;
    }
    if (type === "underline") {
      newInheritedStyles.underline = true;
    }
    if (type === "strikethrough") {
      newInheritedStyles.strikethrough = true;
    }

    const processedContent = parseRecursive(
      content || "",
      baseOffset + matchStart,
      newInheritedStyles,
    );

    // 计算在最终文本中的位置
    const finalStart = baseOffset + matchStart;
    const finalEnd = finalStart + processedContent.length;

    // 添加样式信息
    if (type === "color" && colorValue && isValidHexColor(colorValue)) {
      colorSpans.push({
        start: finalStart,
        end: finalEnd,
        color: colorValue.toUpperCase(),
      });
    } else if (type !== "color") {
      // 查找是否已有相同位置的样式范围
      let existingSpan = styleSpans.find(
        (span) => span.start === finalStart && span.end === finalEnd,
      );

      if (!existingSpan) {
        existingSpan = {
          start: finalStart,
          end: finalEnd,
          ...inheritedStyles, // 继承外层样式
        };
        styleSpans.push(existingSpan);
      }

      // 添加当前标签的样式
      switch (type) {
        case "bold":
          existingSpan.bold = true;
          break;
        case "italic":
          existingSpan.italic = true;
          break;
        case "underline":
          existingSpan.underline = true;
          break;
        case "strikethrough":
          existingSpan.strikethrough = true;
          break;
      }
    }

    // 构建新的文本（移除当前标签，保留内容）
    const newResult = beforeText + processedContent + afterText;

    // 递归处理剩余的标签
    return parseRecursive(newResult, baseOffset, inheritedStyles);
  };

  const cleanText = parseRecursive(text);

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
  return /<(c=#[0-9A-Fa-f]{6}|color=#[0-9A-Fa-f]{6}|b|i|u|s)>.*?<\/(c|color|b|i|u|s)>/.test(
    text,
  );
};

// 保持向后兼容性
export const hasColorTags = hasStyleTags;
