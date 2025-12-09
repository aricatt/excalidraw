#!/bin/bash

# 阿里云 ECS 配置 Swap 脚本

echo "🚀 开始配置 Swap..."
echo ""

# 检查当前 swap 状态
echo "📊 当前 Swap 状态："
free -h | grep -i swap
echo ""

# 检查是否已有 swap 文件
if [ -f /swapfile ]; then
    echo "⚠️  检测到已存在 /swapfile"
    read -p "是否删除并重新创建？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo swapoff /swapfile 2>/dev/null
        sudo rm /swapfile
    else
        echo "❌ 取消操作"
        exit 1
    fi
fi

# 询问 swap 大小
echo "💾 请选择 Swap 大小："
echo "   1) 2GB (适合 1-2GB 内存服务器)"
echo "   2) 4GB (推荐，适合 2-4GB 内存服务器)"
echo "   3) 8GB (适合 4GB+ 内存服务器)"
echo ""
read -p "请选择 (1/2/3) [默认: 2]: " choice
choice=${choice:-2}

case $choice in
    1)
        SWAP_SIZE="2G"
        ;;
    2)
        SWAP_SIZE="4G"
        ;;
    3)
        SWAP_SIZE="8G"
        ;;
    *)
        echo "❌ 无效选择，使用默认值 4G"
        SWAP_SIZE="4G"
        ;;
esac

echo ""
echo "📝 配置信息："
echo "   Swap 大小: $SWAP_SIZE"
echo "   Swap 文件: /swapfile"
echo ""

# 创建 swap 文件
echo "1️⃣  创建 Swap 文件 ($SWAP_SIZE)..."
sudo fallocate -l $SWAP_SIZE /swapfile

if [ $? -ne 0 ]; then
    echo "⚠️  fallocate 失败，尝试使用 dd..."
    sudo dd if=/dev/zero of=/swapfile bs=1M count=$((${SWAP_SIZE%G}*1024)) status=progress
fi

# 设置权限
echo "2️⃣  设置文件权限..."
sudo chmod 600 /swapfile

# 格式化为 swap
echo "3️⃣  格式化为 Swap..."
sudo mkswap /swapfile

# 启用 swap
echo "4️⃣  启用 Swap..."
sudo swapon /swapfile

# 验证
echo "5️⃣  验证 Swap 状态..."
sudo swapon --show
echo ""
free -h | grep -i swap

# 配置开机自动挂载
echo ""
echo "6️⃣  配置开机自动挂载..."
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ 已添加到 /etc/fstab"
else
    echo "✅ /etc/fstab 已包含 swap 配置"
fi

# 优化 swap 使用策略
echo ""
echo "7️⃣  优化 Swap 参数..."
# swappiness: 控制 swap 使用倾向 (0-100，默认 60)
# 10 表示尽量使用物理内存，只在必要时使用 swap
sudo sysctl vm.swappiness=10
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf

# vfs_cache_pressure: 控制缓存回收倾向
sudo sysctl vm.vfs_cache_pressure=50
echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Swap 配置完成！"
echo ""
echo "📊 当前系统内存状态："
free -h
echo ""
echo "💡 优化参数："
echo "   vm.swappiness = 10 (尽量使用物理内存)"
echo "   vm.vfs_cache_pressure = 50 (平衡缓存使用)"
echo ""
echo "✅ 现在可以重新运行部署脚本："
echo "   ./podman-plus.sh"
echo ""
