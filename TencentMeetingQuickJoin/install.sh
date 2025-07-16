#!/bin/bash

# 腾讯会议快速加入工具安装脚本

echo "🚀 开始安装腾讯会议快速加入工具..."

# 检查腾讯会议是否已安装
if [ ! -d "/Applications/腾讯会议.app" ] && [ ! -d "/Applications/TencentMeeting.app" ]; then
    echo "❌ 未检测到腾讯会议应用，请先安装腾讯会议"
    echo "📥 下载地址: https://meeting.tencent.com/download/"
    exit 1
fi

# 创建应用程序目录
SCRIPT_DIR="$HOME/Applications/TencentMeetingQuickJoin"
mkdir -p "$SCRIPT_DIR"

# 复制脚本文件
cp "TencentMeetingQuickJoin.applescript" "$SCRIPT_DIR/"

# 编译为应用程序
osacompile -o "$SCRIPT_DIR/腾讯会议快速加入.app" "$SCRIPT_DIR/TencentMeetingQuickJoin.applescript"

# 设置执行权限
chmod +x "$SCRIPT_DIR/腾讯会议快速加入.app"

echo "✅ 安装完成！"
echo "📍 应用位置: $SCRIPT_DIR/腾讯会议快速加入.app"
echo ""
echo "📖 使用方法:"
echo "1. 复制包含会议号的文本到剪贴板"
echo "2. 双击运行'腾讯会议快速加入.app'"
echo "3. 确认会议号并自动加入会议"
echo ""
echo "💡 建议: 将应用拖拽到 Dock 栏或设置快捷键以便快速访问"