#!/bin/bash

# 标签功能测试脚本
# 使用方法: ./test_tags.sh <token>

TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "Usage: ./test_tags.sh <your_jwt_token>"
    echo ""
    echo "获取 token 的方法:"
    echo "1. 在浏览器中登录 http://localhost:4417"
    echo "2. 打开浏览器开发者工具 -> Application -> Local Storage"
    echo "3. 找到 'token' 字段并复制其值"
    exit 1
fi

API_URL="http://localhost:6602"

echo "========================================="
echo "标签功能测试"
echo "========================================="
echo ""

# 1. 获取所有标签
echo "1. 获取所有标签 (GET /tags)"
echo "-----------------------------------------"
curl -s -X GET "$API_URL/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# 2. 创建新标签
echo "2. 创建新标签 (POST /tags)"
echo "-----------------------------------------"
TAG_RESPONSE=$(curl -s -X POST "$API_URL/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试标签-'$(date +%s)'",
    "color": "#FF6B6B"
  }')
echo "$TAG_RESPONSE" | jq '.'
TAG_ID=$(echo "$TAG_RESPONSE" | jq -r '.tag.id')
echo ""
echo "创建的标签 ID: $TAG_ID"
echo ""

# 3. 获取绘图列表
echo "3. 获取绘图列表 (GET /drawings)"
echo "-----------------------------------------"
DRAWINGS_RESPONSE=$(curl -s -X GET "$API_URL/drawings?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$DRAWINGS_RESPONSE" | jq '.'
DRAWING_ID=$(echo "$DRAWINGS_RESPONSE" | jq -r '.drawings[0].id')
echo ""
echo "第一个绘图 ID: $DRAWING_ID"
echo ""

if [ "$DRAWING_ID" != "null" ] && [ "$TAG_ID" != "null" ]; then
    # 4. 为绘图分配标签
    echo "4. 为绘图分配标签 (POST /drawings/$DRAWING_ID/tags)"
    echo "-----------------------------------------"
    curl -s -X POST "$API_URL/drawings/$DRAWING_ID/tags" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"tagIds\": [\"$TAG_ID\"]
      }" | jq '.'
    echo ""
    echo ""

    # 5. 获取该绘图详情(验证标签已分配)
    echo "5. 获取绘图详情 (GET /drawings/$DRAWING_ID)"
    echo "-----------------------------------------"
    curl -s -X GET "$API_URL/drawings/$DRAWING_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq '.drawing.tags'
    echo ""
    echo ""

    # 6. 通过标签筛选绘图
    echo "6. 通过标签筛选绘图 (GET /drawings?tagId=$TAG_ID)"
    echo "-----------------------------------------"
    curl -s -X GET "$API_URL/drawings?tagId=$TAG_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq '.drawings | length'
    echo " 个绘图包含此标签"
    echo ""
    echo ""

    # 7. 从绘图移除标签
    echo "7. 从绘图移除标签 (DELETE /drawings/$DRAWING_ID/tags/$TAG_ID)"
    echo "-----------------------------------------"
    curl -s -X DELETE "$API_URL/drawings/$DRAWING_ID/tags/$TAG_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq '.'
    echo ""
    echo ""

    # 8. 删除测试标签
    echo "8. 删除测试标签 (DELETE /tags/$TAG_ID)"
    echo "-----------------------------------------"
    curl -s -X DELETE "$API_URL/tags/$TAG_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq '.'
    echo ""
fi

echo ""
echo "========================================="
echo "测试完成!"
echo "========================================="
