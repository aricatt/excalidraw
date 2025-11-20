#!/bin/bash

# 测试更新后的 drawings API

BASE_URL="http://localhost:6602"

echo "🧪 测试 Drawings API (集合和标签支持)"
echo ""

# 1. 登录获取 token
echo "1️⃣ 登录..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "test123456"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "✅ Token 获取成功"
echo ""

# 2. 获取工作空间
echo "2️⃣ 获取工作空间..."
WORKSPACES=$(curl -s -X GET $BASE_URL/api/workspaces \
  -H "Authorization: Bearer $TOKEN")
WORKSPACE_ID=$(echo "$WORKSPACES" | jq -r '.workspaces[0].id')
echo "✅ 工作空间 ID: $WORKSPACE_ID"
echo ""

# 3. 获取集合
echo "3️⃣ 获取集合..."
COLLECTIONS=$(curl -s -X GET "$BASE_URL/api/collections?workspaceId=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN")
COLLECTION_ID=$(echo "$COLLECTIONS" | jq -r '.collections[0].id')
COLLECTION_NAME=$(echo "$COLLECTIONS" | jq -r '.collections[0].name')
echo "✅ 集合: $COLLECTION_NAME (ID: $COLLECTION_ID)"
echo ""

# 4. 获取标签
echo "4️⃣ 获取标签..."
TAGS=$(curl -s -X GET $BASE_URL/api/tags \
  -H "Authorization: Bearer $TOKEN")
TAG_ID=$(echo "$TAGS" | jq -r '.tags[0].id')
TAG_NAME=$(echo "$TAGS" | jq -r '.tags[0].name')
echo "✅ 标签: $TAG_NAME (ID: $TAG_ID)"
echo ""

# 5. 创建绘图 (带集合和标签)
echo "5️⃣ 创建绘图 (指定集合和标签)..."
DRAWING_RESPONSE=$(curl -s -X POST $BASE_URL/api/drawings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"测试绘图 - 带集合和标签\",
    \"description\": \"这个绘图属于 $COLLECTION_NAME 集合\",
    \"workspaceId\": \"$WORKSPACE_ID\",
    \"collectionId\": \"$COLLECTION_ID\",
    \"tagIds\": [\"$TAG_ID\"],
    \"content\": {
      \"type\": \"excalidraw\",
      \"version\": 2,
      \"source\": \"https://excalidraw.com\",
      \"elements\": [],
      \"appState\": {}
    }
  }")

echo "$DRAWING_RESPONSE" | jq .
DRAWING_ID=$(echo "$DRAWING_RESPONSE" | jq -r '.drawing.id')
echo ""

# 6. 按集合过滤绘图
echo "6️⃣ 按集合过滤绘图..."
curl -s -X GET "$BASE_URL/api/drawings?collectionId=$COLLECTION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.drawings[] | {id, title, collection: .collection.name, tags: [.tags[].tag.name]}'
echo ""

# 7. 按标签过滤绘图
echo "7️⃣ 按标签过滤绘图..."
curl -s -X GET "$BASE_URL/api/drawings?tagId=$TAG_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.drawings[] | {id, title, tags: [.tags[].tag.name]}'
echo ""

# 8. 获取绘图详情
echo "8️⃣ 获取绘图详情..."
curl -s -X GET "$BASE_URL/api/drawings/$DRAWING_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    id: .drawing.id,
    title: .drawing.title,
    workspace: .drawing.workspaceId,
    collection: .drawing.collection.name,
    tags: [.drawing.tags[].tag.name]
  }'
echo ""

echo "✅ 所有测试完成!"
