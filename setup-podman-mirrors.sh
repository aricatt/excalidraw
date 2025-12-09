#!/bin/bash

# 阿里云 Podman 镜像加速一键配置脚本（修复版）

echo "🚀 开始配置 Podman 镜像加速（阿里云优化版）..."
echo ""

# 1. 创建配置目录
echo "📁 创建配置目录..."
sudo mkdir -p /etc/containers

# 2. 备份旧配置
if [ -f /etc/containers/registries.conf ]; then
    echo "💾 备份旧配置..."
    sudo cp /etc/containers/registries.conf /etc/containers/registries.conf.bak.$(date +%Y%m%d_%H%M%S)
fi

# 3. 写入新配置（使用正确的阿里云镜像格式）
echo "✍️  写入镜像加速配置..."
sudo tee /etc/containers/registries.conf > /dev/null <<'EOF'
# Podman 镜像仓库配置
# 适用于阿里云服务器

unqualified-search-registries = ["docker.io"]

# Docker Hub 镜像加速
[[registry]]
location = "docker.io"
insecure = false

  [[registry.mirror]]
  location = "dockerproxy.com"
  insecure = false

  [[registry.mirror]]
  location = "docker.m.daocloud.io"
  insecure = false

  [[registry.mirror]]
  location = "docker.nju.edu.cn"
  insecure = false
EOF

echo ""
echo "✅ 配置完成！"
echo ""
echo "📋 已配置的镜像源："
echo "   1. dockerproxy.com (国内代理)"
echo "   2. docker.m.daocloud.io (DaoCloud)"
echo "   3. docker.nju.edu.cn (南京大学)"
echo ""
echo "🧪 测试拉取镜像："
echo "   podman pull node:18-alpine"
echo ""

# 4. 测试配置
echo "🧪 测试镜像拉取..."
if timeout 120 podman pull node:18-alpine; then
    echo ""
    echo "🎉 镜像加速配置成功！"
    echo ""
    echo "✅ 现在可以运行部署脚本了："
    echo "   ./podman-plus.sh"
else
    echo ""
    echo "⚠️  镜像拉取仍有问题，尝试备用方案..."
    echo ""
    echo "备用方案 1: 手动拉取镜像"
    echo "  podman pull dockerproxy.com/library/node:18-alpine"
    echo "  podman tag dockerproxy.com/library/node:18-alpine docker.io/library/node:18-alpine"
    echo ""
    echo "备用方案 2: 使用预构建镜像"
    echo "  查看 ALIYUN_MIRROR_SETUP.md 获取更多信息"
fi
