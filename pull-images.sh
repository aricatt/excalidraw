#!/bin/bash

# 手动拉取并标记所需镜像（适用于网络受限环境）

echo "🚀 开始手动拉取项目所需镜像..."
echo ""

# 定义镜像列表
IMAGES=(
    "node:18-alpine"
    "caddy:2-alpine"
    "redis:alpine"
    "mysql:8.0"
)

# 使用的镜像源（按优先级）
MIRRORS=(
    "dockerproxy.com"
    "docker.m.daocloud.io"
    "docker.nju.edu.cn"
)

# 拉取镜像函数
pull_image() {
    local image=$1
    local success=false
    
    echo "📦 拉取镜像: $image"
    
    # 尝试每个镜像源
    for mirror in "${MIRRORS[@]}"; do
        echo "   尝试镜像源: $mirror"
        
        # 构建完整镜像路径
        if [[ $image == *"/"* ]]; then
            # 已包含仓库路径
            mirror_image="$mirror/$image"
        else
            # 添加 library 前缀
            mirror_image="$mirror/library/$image"
        fi
        
        # 尝试拉取
        if timeout 120 podman pull "$mirror_image" 2>/dev/null; then
            echo "   ✅ 成功从 $mirror 拉取"
            
            # 标记为官方镜像名
            podman tag "$mirror_image" "docker.io/$image" 2>/dev/null || \
            podman tag "$mirror_image" "$image"
            
            success=true
            break
        else
            echo "   ❌ 失败，尝试下一个镜像源..."
        fi
    done
    
    if [ "$success" = false ]; then
        echo "   ⚠️  所有镜像源都失败，尝试直接拉取..."
        if timeout 180 podman pull "$image"; then
            echo "   ✅ 直接拉取成功"
            success=true
        fi
    fi
    
    if [ "$success" = false ]; then
        echo "   ❌ 镜像 $image 拉取失败"
        return 1
    fi
    
    echo ""
    return 0
}

# 拉取所有镜像
failed_images=()

for image in "${IMAGES[@]}"; do
    if ! pull_image "$image"; then
        failed_images+=("$image")
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示结果
if [ ${#failed_images[@]} -eq 0 ]; then
    echo "🎉 所有镜像拉取成功！"
    echo ""
    echo "📋 已拉取的镜像："
    podman images | grep -E "node|caddy|redis|mysql"
    echo ""
    echo "✅ 现在可以运行部署脚本："
    echo "   ./podman-plus.sh"
else
    echo "⚠️  以下镜像拉取失败："
    for img in "${failed_images[@]}"; do
        echo "   - $img"
    done
    echo ""
    echo "💡 建议："
    echo "   1. 检查网络连接"
    echo "   2. 尝试使用 VPN 或代理"
    echo "   3. 联系阿里云技术支持检查网络策略"
    echo "   4. 考虑使用预构建的镜像包"
fi

echo ""
