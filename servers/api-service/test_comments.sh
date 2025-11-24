#!/bin/bash

# Comment API 测试脚本

API_URL="http://localhost:6602/api"
TOKEN=""  # 需要先登录获取 token

echo "=== Comment API Tests ==="
echo ""

# 1. 登录获取 token
echo "1. 登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# 2. 创建一个测试绘图
echo "2. 创建测试绘图..."
DRAWING_RESPONSE=$(curl -s -X POST "$API_URL/drawings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Drawing for Comments",
    "content": {
      "elements": [],
      "appState": {}
    }
  }')

DRAWING_ID=$(echo $DRAWING_RESPONSE | jq -r '.id')
echo "Drawing ID: $DRAWING_ID"
echo ""

# 3. 创建评论
echo "3. 创建评论..."
COMMENT1=$(curl -s -X POST "$API_URL/drawings/$DRAWING_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "This is my first comment!"
  }')

COMMENT1_ID=$(echo $COMMENT1 | jq -r '.id')
echo "Comment 1: $(echo $COMMENT1 | jq '.')"
echo ""

# 4. 创建第二条评论
echo "4. 创建第二条评论..."
COMMENT2=$(curl -s -X POST "$API_URL/drawings/$DRAWING_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "This is another comment with more details."
  }')

echo "Comment 2: $(echo $COMMENT2 | jq '.')"
echo ""

# 5. 获取所有评论
echo "5. 获取所有评论..."
COMMENTS=$(curl -s -X GET "$API_URL/drawings/$DRAWING_ID/comments" \
  -H "Authorization: Bearer $TOKEN")

echo "All Comments: $(echo $COMMENTS | jq '.')"
echo ""

# 6. 更新评论
echo "6. 更新评论..."
UPDATED_COMMENT=$(curl -s -X PUT "$API_URL/comments/$COMMENT1_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "This is my UPDATED first comment!"
  }')

echo "Updated Comment: $(echo $UPDATED_COMMENT | jq '.')"
echo ""

# 7. 再次获取所有评论（验证更新）
echo "7. 验证更新..."
COMMENTS=$(curl -s -X GET "$API_URL/drawings/$DRAWING_ID/comments" \
  -H "Authorization: Bearer $TOKEN")

echo "All Comments after update: $(echo $COMMENTS | jq '.')"
echo ""

# 8. 删除评论
echo "8. 删除评论..."
curl -s -X DELETE "$API_URL/comments/$COMMENT1_ID" \
  -H "Authorization: Bearer $TOKEN"

echo "Comment deleted"
echo ""

# 9. 最终验证
echo "9. 最终验证（应该只剩一条评论）..."
COMMENTS=$(curl -s -X GET "$API_URL/drawings/$DRAWING_ID/comments" \
  -H "Authorization: Bearer $TOKEN")

echo "Final Comments: $(echo $COMMENTS | jq '.')"
echo ""

echo "=== Tests Complete ==="
