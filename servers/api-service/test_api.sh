#!/bin/bash

# API 测试脚本

BASE_URL="http://localhost:6602"

echo "🧪 测试 Excalidraw Plus API"
echo ""

# 1. 健康检查
echo "1️⃣ 测试健康检查..."
curl -s $BASE_URL/health | jq .
echo ""

# 2. 注册用户
echo "2️⃣ 注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "username": "testuser2",
    "password": "test123456"
  }')

echo "$REGISTER_RESPONSE" | jq .

# 提取 token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "⚠️  注册失败或用户已存在，尝试登录..."
    LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test2@example.com",
        "password": "test123456"
      }')
    echo "$LOGIN_RESPONSE" | jq .
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
fi

echo ""
echo "🔑 Token: ${TOKEN:0:50}..."
echo ""

# 3. 创建工作空间
echo "3️⃣ 创建工作空间..."
WORKSPACE_RESPONSE=$(curl -s -X POST $BASE_URL/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "测试工作空间",
    "description": "这是一个测试工作空间"
  }')

echo "$WORKSPACE_RESPONSE" | jq .
WORKSPACE_ID=$(echo "$WORKSPACE_RESPONSE" | jq -r '.workspace.id')
echo ""

# 4. 获取工作空间列表
echo "4️⃣ 获取工作空间列表..."
curl -s -X GET $BASE_URL/api/workspaces \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 5. 获取集合列表
echo "5️⃣ 获取集合列表 (应该有2个默认集合)..."
curl -s -X GET "$BASE_URL/api/collections?workspaceId=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 6. 创建标签
echo "6️⃣ 创建标签..."
curl -s -X POST $BASE_URL/api/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "重要",
    "color": "#ff0000"
  }' | jq .
echo ""

# 7. 创建绘图
echo "7️⃣ 创建绘图..."
curl -s -X POST $BASE_URL/api/drawings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "我的第一个绘图",
    "description": "测试绘图",
    "content": {
      "type": "excalidraw",
      "version": 2,
      "source": "https://excalidraw.com",
      "elements": [],
      "appState": {}
    }
  }' | jq .
echo ""

echo "✅ 所有测试完成!"
