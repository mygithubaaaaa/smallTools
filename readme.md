# 小工具集合 🛠️

一个实用的小工具集合，包含各种提升开发效率和工作便利性的工具。

## 📋 工具列表

| 工具名称 | 描述 | 类型 | 状态 | 最后更新 |
|---------|------|------|------|----------|
| [tampermonkey-http-interceptor](#tampermonkey-http-interceptor) | HTTP请求拦截器，支持请求体、请求头、域名替换和URL路径替换 | Tampermonkey脚本 | ✅ 可用 | 2025-07-14 |

## 🔧 工具详情

### tampermonkey-http-interceptor

**HTTP请求拦截器**

- **功能**: 拦截网页中的HTTP请求并动态修改请求体、请求头、域名和URL路径
- **特性**:
  - 🎯 **请求体修改**: 支持URL模式匹配（支持正则表达式），动态修改请求体参数
  - 📝 **请求头修改**: 动态添加、修改或覆盖HTTP请求头
  - 🌐 **域名替换**: 自动替换请求中的域名，支持开发环境切换
  - 🔄 **URL路径替换**: 精确替换匹配的URL路径部分，支持API版本升级和端点重命名
  - ⚙️ **多种数据类型**: 支持字符串、数字、布尔值、函数等多种参数类型
  - 🎛️ **可视化配置**: 内置图形化配置界面，操作简单直观
  - ⚡ **实时生效**: 配置变更后立即生效，无需刷新页面
  - 📋 **规则管理**: 支持多个拦截规则，可独立启用/禁用
- **使用场景**: 
  - 🐛 接口调试和测试
  - 💉 参数注入和数据模拟
  - 🔄 环境切换（开发/测试/生产）
  - 📈 API版本升级和端点迁移
  - 🌍 请求代理和路径重写
- **安装**: 
  1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
  2. 复制 `tampermonkey-http-interceptor.js` 内容创建新脚本
  3. 保存并启用脚本
  4. 在网页上右键选择"配置拦截规则"或按 F12 控制台输入 `window.tampermonkeyInterceptor.openConfig()`

- **功能详情**:
  
  | 功能模块 | 描述 | 示例 |
  |---------|------|------|
  | **请求体修改** | 动态修改JSON请求体中的字段值 | `{"userId": 123}` → `{"userId": 456}` |
  | **请求头修改** | 添加或修改HTTP请求头 | 添加 `Authorization: Bearer token123` |
  | **域名替换** | 替换请求的域名部分 | `api.example.com` → `api-dev.example.com` |
  | **URL路径替换** | 精确替换URL中匹配的路径 | `/api/v1/users` → `/api/v2/users` |

- **配置说明**:
  - **基础设置**: 规则名称、URL匹配模式（支持正则表达式）
  - **请求体修改**: 添加、修改或删除JSON请求体中的字段，支持条件覆盖
  - **请求头修改**: 设置自定义HTTP请求头，可独立启用/禁用
  - **域名替换**: 将原始域名替换为目标域名（可选择仅在URL匹配时生效）
  - **URL路径替换**: 将匹配的URL路径部分替换为新路径，支持正则表达式替换

## 🚀 快速开始

### 安装要求

- 现代浏览器（Chrome、Firefox、Edge等）
- Tampermonkey 扩展（针对浏览器脚本）

### 使用方法

1. **克隆仓库**
   ```bash
   git clone <your-repo-url>
   cd smallTools
   ```

2. **选择需要的工具**
   - 每个工具都有独立的文件和说明
   - 根据需要选择合适的工具

3. **按照具体工具的安装说明进行配置**

## 📖 使用示例

### tampermonkey-http-interceptor 配置示例

#### 场景1：API版本升级
```javascript
// 配置规则
URL模式: /api/v1/
URL路径替换: /api/v2/
效果: https://api.example.com/api/v1/users → https://api.example.com/api/v2/users
```

#### 场景2：开发环境切换
```javascript
// 配置规则  
URL模式: api.example.com
域名替换: api.example.com → api-dev.example.com
效果: https://api.example.com/users → https://api-dev.example.com/users
```

#### 场景3：请求参数注入
```javascript
// 配置规则
URL模式: /api/login
请求体修改: 
  - debug: true
  - environment: "test"
效果: 自动在登录请求中注入调试参数
```

### 功能对比表

| 功能 | 作用范围 | 适用场景 | 示例 |
|------|----------|----------|------|
| **请求体修改** | JSON请求体字段 | 参数注入、数据模拟 | 修改用户ID、添加调试标志 |
| **请求头修改** | HTTP Headers | 认证、调试、标识 | 添加Token、设置User-Agent |
| **域名替换** | URL域名部分 | 环境切换 | 生产→测试环境 |
| **URL路径替换** | URL路径部分 | API升级、端点重命名 | v1→v2、旧端点→新端点 |

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📞 联系

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发起 Pull Request

---

⭐ 如果这些工具对你有帮助，请给个 Star 支持一下！

