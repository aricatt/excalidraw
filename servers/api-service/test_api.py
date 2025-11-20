#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:6602"

print("🧪 测试 Excalidraw Plus API\n")

# 1. 测试健康检查
print("1️⃣ 测试健康检查...")
response = requests.get(f"{BASE_URL}/health")
print(f"   状态码: {response.status_code}")
print(f"   响应: {response.json()}\n")

# 2. 注册用户
print("2️⃣ 注册新用户...")
register_data = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123456"
}
response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
print(f"   状态码: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    token = result.get("token")
    user_id = result["user"]["id"]
    print(f"   ✅ 用户创建成功!")
    print(f"   用户ID: {user_id}")
    print(f"   Token: {token[:50]}...\n")
elif response.status_code == 400:
    print(f"   ⚠️  用户已存在，尝试登录...\n")
    # 尝试登录
    login_data = {
        "email": "test@example.com",
        "password": "test123456"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        result = response.json()
        token = result.get("token")
        user_id = result["user"]["id"]
        print(f"   ✅ 登录成功!")
        print(f"   用户ID: {user_id}")
        print(f"   Token: {token[:50]}...\n")
    else:
        print(f"   ❌ 登录失败: {response.text}\n")
        exit(1)
else:
    print(f"   ❌ 注册失败: {response.text}\n")
    exit(1)

# 3. 创建工作空间
print("3️⃣ 创建工作空间...")
headers = {"Authorization": f"Bearer {token}"}
workspace_data = {
    "name": "测试工作空间",
    "description": "这是一个测试工作空间"
}
response = requests.post(f"{BASE_URL}/api/workspaces", json=workspace_data, headers=headers)
print(f"   状态码: {response.status_code}")
if response.status_code == 201:
    workspace = response.json()["workspace"]
    workspace_id = workspace["id"]
    print(f"   ✅ 工作空间创建成功!")
    print(f"   工作空间ID: {workspace_id}")
    print(f"   名称: {workspace['name']}\n")
else:
    print(f"   ❌ 创建失败: {response.text}\n")
    exit(1)

# 4. 获取工作空间列表
print("4️⃣ 获取工作空间列表...")
response = requests.get(f"{BASE_URL}/api/workspaces", headers=headers)
print(f"   状态码: {response.status_code}")
if response.status_code == 200:
    workspaces = response.json()["workspaces"]
    print(f"   ✅ 找到 {len(workspaces)} 个工作空间")
    for ws in workspaces:
        print(f"      - {ws['name']} (ID: {ws['id']})\n")
else:
    print(f"   ❌ 获取失败: {response.text}\n")

# 5. 获取集合列表
print("5️⃣ 获取集合列表...")
response = requests.get(f"{BASE_URL}/api/collections?workspaceId={workspace_id}", headers=headers)
print(f"   状态码: {response.status_code}")
if response.status_code == 200:
    collections = response.json()["collections"]
    print(f"   ✅ 找到 {len(collections)} 个集合 (应该有2个默认集合)")
    for col in collections:
        print(f"      - {col['name']} (默认: {col['isDefault']})\n")
else:
    print(f"   ❌ 获取失败: {response.text}\n")

# 6. 创建标签
print("6️⃣ 创建标签...")
tag_data = {
    "name": "重要",
    "color": "#ff0000"
}
response = requests.post(f"{BASE_URL}/api/tags", json=tag_data, headers=headers)
print(f"   状态码: {response.status_code}")
if response.status_code == 201:
    tag = response.json()["tag"]
    print(f"   ✅ 标签创建成功!")
    print(f"   标签: {tag['name']} ({tag['color']})\n")
else:
    print(f"   ⚠️  {response.text}\n")

# 7. 创建绘图
print("7️⃣ 创建绘图...")
drawing_data = {
    "title": "我的第一个绘图",
    "description": "测试绘图",
    "content": {
        "type": "excalidraw",
        "version": 2,
        "source": "https://excalidraw.com",
        "elements": [],
        "appState": {}
    }
}
response = requests.post(f"{BASE_URL}/api/drawings", json=drawing_data, headers=headers)
print(f"   状态码: {response.status_code}")
if response.status_code == 201:
    drawing = response.json()["drawing"]
    print(f"   ✅ 绘图创建成功!")
    print(f"   绘图ID: {drawing['id']}")
    print(f"   标题: {drawing['title']}\n")
else:
    print(f"   ❌ 创建失败: {response.text}\n")

print("✅ 所有测试完成!")
