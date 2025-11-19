import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据初始化...");

  // 创建测试用户
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: "test@excalidraw.com" },
    update: {},
    create: {
      email: "test@excalidraw.com",
      username: "testuser",
      password: hashedPassword,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser",
    },
  });

  console.log("✅ 创建测试用户:", testUser.username);

  // 创建示例绘图（简化版，不依赖工作空间）
  const sampleDrawing = await prisma.drawing.upsert({
    where: { id: "sample-drawing" },
    update: {},
    create: {
      id: "sample-drawing",
      title: "Welcome to Excalidraw Plus",
      description: "欢迎使用 Excalidraw Plus！",
      content: {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: [
          {
            id: "welcome-text",
            type: "text",
            x: 100,
            y: 100,
            width: 300,
            height: 50,
            text: "Welcome to Excalidraw Plus!",
            fontSize: 20,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle",
          },
        ],
        appState: {
          gridSize: null,
          viewBackgroundColor: "#ffffff",
        },
      },
      userId: testUser.id,
      thumbnail:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMDAiIHk9IjUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+V2VsY29tZSB0byBFeGNhbGlkcmF3IFBsdXMhPC90ZXh0Pjwvc3ZnPg==",
      isPublic: false,
      version: 1,
    },
  });

  console.log("✅ 创建示例绘图:", sampleDrawing.title);

  console.log("🎉 种子数据初始化完成！");
  console.log("");
  console.log("📋 测试账户信息:");
  console.log("   邮箱: test@excalidraw.com");
  console.log("   密码: password123");
  console.log("");
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
