#!/bin/bash

# 阿里云 Podman 镜像加速一键配置脚本

echo "🚀 开始配置 Podman 镜像加速..."
echo ""

# 1. 创建配置目录
echo "📁 创建配置目录..."
sudo mkdir -p /etc/containers

# 2. 备份旧配置
if [ -f /etc/containers/registries.conf ]; then
    echo "💾 备份旧配置..."
    sudo cp /etc/containers/registries.conf /etc/containers/registries.conf.bak.$(date +%Y%m%d_%H%M%S)
fi

# 3. 写入新配置
echo "✍️  写入镜像加速配置..."
sudo tee /etc/containers/registries.conf > /dev/null <<'EOF'
# Podman 镜像仓库配置
# 适用于中国大陆阿里云服务器

unqualified-search-registries = ["docker.io"]

[[registry]]
prefix = "docker.io"
location = "docker.io"

# 阿里云杭州镜像（公共）
[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"
insecure = false

# 中科大镜像
[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"
insecure = false

# 网易镜像
[[registry.mirror]]
location = "hub-mirror.c.163.com"
insecure = false

# 腾讯云镜像
[[registry.mirror]]
location = "mirror.ccs.tencentyun.com"
insecure = false
EOF

echo ""
echo "✅ 配置完成！"
echo ""
echo "📋 已配置的镜像源："
echo "   1. registry.cn-hangzhou.aliyuncs.com (阿里云)"
echo "   2. docker.mirrors.ustc.edu.cn (中科大)"
echo "   3. hub-mirror.c.163.com (网易)"
echo "   4. mirror.ccs.tencentyun.com (腾讯云)"
echo ""
echo "🧪 测试拉取镜像："
echo "   podman pull node:18-alpine"
echo ""
echo "🔍 查看配置："
echo "   cat /etc/containers/registries.conf"
echo ""
echo "📚 详细文档："
echo "   cat ALIYUN_MIRROR_SETUP.md"
echo ""

# 4. 测试配置
echo "🧪 测试镜像拉取..."
if podman pull node:18-alpine; then
    echo ""
    echo "🎉 镜像加速配置成功！"
else
    echo ""
    echo "⚠️  测试失败，请检查网络连接"
fi
