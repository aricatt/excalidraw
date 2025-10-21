// 简单的测试脚本来验证颜色标记解析
const { parseColorTags } = require('./packages/element/src/textColorUtils');

// 测试用例
const testCases = [
  "<color=#FF6B35>自定义橙色</color>",
  "这是<color=#FF0000>红色</color>文字和<color=#0000FF>蓝色</color>文字",
  "普通文字没有颜色",
  "<color=#INVALID>无效颜色</color>",
];

console.log("测试颜色标记解析：");
testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: "${testCase}"`);
  try {
    const result = parseColorTags(testCase);
    console.log("解析结果:", result);
  } catch (error) {
    console.error("解析错误:", error.message);
  }
});
