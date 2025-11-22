# 导入功能实现文档

## 功能概述

实现从本地文件导入 Excalidraw 绘图的功能,支持以下格式:
- `.excalidraw` - Excalidraw 原生 JSON 格式
- `.png` - 带有嵌入 Excalidraw 数据的 PNG 图片
- `.svg` - 带有嵌入 Excalidraw 数据的 SVG 图片

## 实现步骤

### 1. 前端实现

#### 添加导入按钮
在 Dashboard 的"New Drawing"按钮旁边添加"Import"按钮

#### 文件处理逻辑
```typescript
const handleFileImport = async (file: File) => {
  try {
    let excalidrawData: any = null;
    
    if (file.name.endsWith('.excalidraw')) {
      // 直接读取 JSON 文件
      const text = await file.text();
      excalidrawData = JSON.parse(text);
    } else if (file.name.endsWith('.png')) {
      // 从 PNG 中提取嵌入的数据
      excalidrawData = await extractDataFromPNG(file);
    } else if (file.name.endsWith('.svg')) {
      // 从 SVG 中提取嵌入的数据
      excalidrawData = await extractDataFromSVG(file);
    }
    
    if (excalidrawData) {
      // 创建新绘图
      const response = await drawingAPI.createDrawing({
        title: file.name.replace(/\.(excalidraw|png|svg)$/, ''),
        content: excalidrawData,
        collectionId: selectedCollectionId || undefined,
      });
      
      // 跳转到编辑器
      navigate(`/editor/${response.data.drawing.id}`);
    }
  } catch (error) {
    console.error('Failed to import file:', error);
    alert('Failed to import file. Please make sure it\'s a valid Excalidraw file.');
  }
};
```

#### 从 PNG 提取数据
```typescript
const extractDataFromPNG = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // PNG 文件可能在 metadata 中包含 Excalidraw 数据
        // 这需要解析 PNG 的 tEXt chunk
        // 简化实现:尝试从文件名或提示用户
        reject(new Error('PNG import not yet fully implemented'));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

#### 从 SVG 提取数据
```typescript
const extractDataFromSVG = async (file: File): Promise<any> => {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  
  // Excalidraw 将数据存储在 SVG 的 metadata 中
  const metadata = doc.querySelector('metadata');
  if (metadata) {
    const content = metadata.textContent;
    if (content) {
      return JSON.parse(content);
    }
  }
  
  throw new Error('No Excalidraw data found in SVG');
};
```

### 2. UI 组件

```tsx
{/* Hidden file input */}
<input
  ref={fileInputRef}
  type="file"
  accept=".excalidraw,.png,.svg"
  className="hidden"
  onChange={handleFileChange}
/>

{/* Import button */}
<button
  onClick={() => fileInputRef.current?.click()}
  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
>
  <Upload className="w-4 h-4 mr-2" />
  Import
</button>
```

## 简化实现

由于完整的 PNG/SVG 数据提取较复杂,第一版可以只支持 `.excalidraw` 文件:

```typescript
const handleFileImport = async (file: File) => {
  if (!file.name.endsWith('.excalidraw')) {
    alert('Please select a .excalidraw file');
    return;
  }
  
  try {
    const text = await file.text();
    const excalidrawData = JSON.parse(text);
    
    const response = await drawingAPI.createDrawing({
      title: file.name.replace('.excalidraw', ''),
      content: excalidrawData,
      collectionId: selectedCollectionId || undefined,
    });
    
    navigate(`/editor/${response.data.drawing.id}`);
  } catch (error) {
    console.error('Failed to import file:', error);
    alert('Failed to import file. Please make sure it\'s a valid Excalidraw file.');
  }
};
```

## 后续优化

1. 添加拖放支持
2. 支持批量导入
3. 完整实现 PNG/SVG 数据提取
4. 添加导入进度提示
5. 文件验证和错误处理
