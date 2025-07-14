// ==UserScript==
// @name         HTTP请求拦截器
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  拦截HTTP请求并修改请求体参数，支持配置页面
// @author       You
// @match        https://*/*
// @match        http://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 从存储中加载配置
    function loadConfig() {
        const savedConfig = GM_getValue('interceptorConfig', '');
        if (savedConfig) {
            try {
                return JSON.parse(savedConfig);
            } catch (e) {
                console.error('加载配置失败:', e);
            }
        }
        // 默认配置
        return {
            rules: [
                {
                    name: '默认规则',
                    urlPattern: 'search/anjia/lockView',
                    isRegex: false,
                    enabled: true,
                    modifications: [
                        { key: 'houseId', value: '122222', type: 'string', onlyIfExists: false },
                        { key: 'timestamp', value: 'Date.now()', type: 'function', onlyIfExists: false },
                        { key: 'injected', value: 'true', type: 'boolean', onlyIfExists: false }
                    ]
                }
            ]
        };
    }

    // 保存配置到存储
    function saveConfig(config) {
        GM_setValue('interceptorConfig', JSON.stringify(config));
    }

    // 创建配置页面
    function createConfigPage() {
        const config = loadConfig();
        
        // 创建遮罩层和弹窗
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        modal.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid #eee;">
                <h2 style="margin: 0; color: #333;">HTTP请求拦截器配置</h2>
            </div>
            <div style="padding: 20px;">
                <div id="rulesContainer"></div>
                <button id="addRuleBtn" style="background: #007cba; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    添加新规则
                </button>
            </div>
            <div style="padding: 20px; border-top: 1px solid #eee; text-align: right;">
                <button id="cancelBtn" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    取消
                </button>
                <button id="saveBtn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    保存
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 添加全局函数（需要在renderRules之前定义）
        window.updateRule = function(index, field, value) {
            config.rules[index][field] = value;
        };

        window.removeRule = function(index) {
            config.rules.splice(index, 1);
            renderRules();
        };

        window.updateModification = function(ruleIndex, modIndex, field, value) {
            config.rules[ruleIndex].modifications[modIndex][field] = value;
        };

        window.removeModification = function(ruleIndex, modIndex) {
            config.rules[ruleIndex].modifications.splice(modIndex, 1);
            renderRules();
        };

        window.addModification = function(ruleIndex) {
            config.rules[ruleIndex].modifications.push({
                key: '',
                value: '',
                type: 'string'
            });
            renderRules();
        };

        // 渲染规则列表
        function renderRules() {
            const container = document.getElementById('rulesContainer');
            container.innerHTML = '';

            config.rules.forEach((rule, index) => {
                const ruleDiv = document.createElement('div');
                ruleDiv.style.cssText = `
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 15px;
                    margin-bottom: 15px;
                    background: #f9f9f9;
                `;

                ruleDiv.innerHTML = `
                    <div style="margin-bottom: 10px;">
                        <label style="display: inline-block; width: 80px; font-weight: bold;">规则名称:</label>
                        <input type="text" value="${rule.name}" data-action="updateRule" data-index="${index}" data-field="name"
                               style="width: 200px; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        <label style="margin-left: 20px;">
                            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="updateRule" data-index="${index}" data-field="enabled">
                            启用
                        </label>
                        <button data-action="removeRule" data-index="${index}" style="float: right; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            删除
                        </button>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: inline-block; width: 80px; font-weight: bold;">URL模式:</label>
                        <input type="text" value="${rule.urlPattern}" data-action="updateRule" data-index="${index}" data-field="urlPattern"
                               style="width: 300px; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        <label style="margin-left: 10px;">
                            <input type="checkbox" ${rule.isRegex ? 'checked' : ''} data-action="updateRule" data-index="${index}" data-field="isRegex">
                            正则表达式
                        </label>
                    </div>
                    <div>
                        <label style="font-weight: bold;">参数修改:</label>
                        <div id="modifications_${index}" style="margin-left: 20px; margin-top: 5px;">
                            ${rule.modifications.map((mod, modIndex) => `
                                <div style="margin-bottom: 8px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #f8f9fa;">
                                    <div style="margin-bottom: 5px;">
                                        <input type="text" value="${mod.key}" placeholder="参数名" 
                                               data-action="updateModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="key"
                                               style="width: 120px; padding: 3px; margin-right: 5px; border: 1px solid #ccc; border-radius: 3px;">
                                        <select data-action="updateModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="type" style="margin-right: 5px;">
                                            <option value="string" ${mod.type === 'string' ? 'selected' : ''}>字符串</option>
                                            <option value="number" ${mod.type === 'number' ? 'selected' : ''}>数字</option>
                                            <option value="boolean" ${mod.type === 'boolean' ? 'selected' : ''}>布尔值</option>
                                            <option value="function" ${mod.type === 'function' ? 'selected' : ''}>函数</option>
                                        </select>
                                        <input type="text" value="${mod.value}" placeholder="值" 
                                               data-action="updateModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="value"
                                               style="width: 150px; padding: 3px; margin-right: 5px; border: 1px solid #ccc; border-radius: 3px;">
                                        <button data-action="removeModification" data-rule-index="${index}" data-mod-index="${modIndex}" 
                                                style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer;">
                                            删除
                                        </button>
                                    </div>
                                    <div style="margin-top: 5px;">
                                        <label style="font-size: 12px; color: #666;">
                                            <input type="checkbox" ${mod.onlyIfExists ? 'checked' : ''} 
                                                   data-action="updateModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="onlyIfExists"
                                                   style="margin-right: 5px;">
                                            仅在字段已存在时覆盖（如果取消勾选，将总是添加或覆盖此字段）
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                            <button data-action="addModification" data-rule-index="${index}" 
                                    style="background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">
                                添加参数
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(ruleDiv);
            });
        }

        // 使用事件委托处理所有交互
        modal.addEventListener('click', function(e) {
            const action = e.target.getAttribute('data-action');
            if (!action) return;

            const index = parseInt(e.target.getAttribute('data-index'));
            const ruleIndex = parseInt(e.target.getAttribute('data-rule-index'));
            const modIndex = parseInt(e.target.getAttribute('data-mod-index'));
            const field = e.target.getAttribute('data-field');

            switch (action) {
                case 'removeRule':
                    config.rules.splice(index, 1);
                    renderRules();
                    break;
                case 'removeModification':
                    config.rules[ruleIndex].modifications.splice(modIndex, 1);
                    renderRules();
                    break;
                case 'addModification':
                    config.rules[ruleIndex].modifications.push({
                        key: '',
                        value: '',
                        type: 'string',
                        onlyIfExists: false
                    });
                    renderRules();
                    break;
            }
        });

        // 处理输入框和选择框的变化
        modal.addEventListener('change', function(e) {
            const action = e.target.getAttribute('data-action');
            if (!action) return;

            const index = parseInt(e.target.getAttribute('data-index'));
            const ruleIndex = parseInt(e.target.getAttribute('data-rule-index'));
            const modIndex = parseInt(e.target.getAttribute('data-mod-index'));
            const field = e.target.getAttribute('data-field');

            switch (action) {
                case 'updateRule':
                    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    config.rules[index][field] = value;
                    break;
                case 'updateModification':
                    const modValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    config.rules[ruleIndex].modifications[modIndex][field] = modValue;
                    break;
            }
        });

        renderRules();

        // 事件监听
        document.getElementById('addRuleBtn').onclick = function() {
            config.rules.push({
                name: '新规则',
                urlPattern: '',
                isRegex: false,
                enabled: true,
                modifications: []
            });
            renderRules();
        };

        document.getElementById('saveBtn').onclick = function() {
            saveConfig(config);
            
            // 动态重新加载配置，无需刷新页面
            const ruleCount = reloadInterceptConfig();
            document.body.removeChild(overlay);
        };

        document.getElementById('cancelBtn').onclick = function() {
            document.body.removeChild(overlay);
        };

        // 点击遮罩层关闭
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
    }

    // 注册菜单命令
    GM_registerMenuCommand('配置拦截规则', createConfigPage);

    // 动态加载配置的拦截器
    let interceptConfig = { rules: [] };

    // 重新加载配置并更新拦截规则
    function reloadInterceptConfig() {
        const currentConfig = loadConfig();
        
        // 转换配置为运行时格式
        interceptConfig.rules = currentConfig.rules.filter(rule => rule.enabled).map(rule => ({
            name: rule.name,
            urlPattern: rule.isRegex ? new RegExp(rule.urlPattern) : rule.urlPattern,
            modifyBody: function(originalBody) {
                try {
                    let bodyData;
                    
                    // 处理JSON格式的请求体
                    if (typeof originalBody === 'string') {
                        bodyData = JSON.parse(originalBody);
                    } else if (originalBody instanceof FormData) {
                        // 处理FormData
                        bodyData = {};
                        for (let [key, value] of originalBody.entries()) {
                            bodyData[key] = value;
                        }
                    } else {
                        bodyData = originalBody;
                    }

                    // 应用修改规则
                    rule.modifications.forEach(mod => {
                        if (mod.key && mod.value !== undefined) {
                            // 检查是否需要判断字段是否已存在
                            const shouldApply = !mod.onlyIfExists || (mod.onlyIfExists && bodyData.hasOwnProperty(mod.key));
                            
                            if (shouldApply) {
                                let value = mod.value;
                                switch (mod.type) {
                                    case 'number':
                                        value = parseFloat(mod.value);
                                        break;
                                    case 'boolean':
                                        value = mod.value === 'true';
                                        break;
                                    case 'function':
                                        try {
                                            value = eval(mod.value);
                                        } catch (e) {
                                            console.error('执行函数失败:', e);
                                            value = mod.value;
                                        }
                                        break;
                                    default:
                                        value = mod.value;
                                }
                                
                                console.log(`应用修改: ${mod.key} = ${value} (onlyIfExists: ${mod.onlyIfExists}, 原字段存在: ${bodyData.hasOwnProperty(mod.key)})`);
                                bodyData[mod.key] = value;
                            } else {
                                console.log(`跳过修改: ${mod.key} (字段不存在且设置为仅覆盖已存在字段)`);
                            }
                        }
                    });
                    
                    // 如果原始请求是FormData，返回FormData
                    if (originalBody instanceof FormData) {
                        const newFormData = new FormData();
                        for (let key in bodyData) {
                            newFormData.append(key, bodyData[key]);
                        }
                        return newFormData;
                    }
                    
                    // 否则返回JSON字符串
                    return JSON.stringify(bodyData);
                } catch (e) {
                    console.error('修改请求体时出错:', e);
                    return originalBody;
                }
            }
        }));
        
        console.log('拦截配置已重新加载，当前规则数量:', interceptConfig.rules.length);
        return interceptConfig.rules.length;
    }

    // 初始化加载配置
    reloadInterceptConfig();

    // 保存原始的fetch和XMLHttpRequest
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    // 检查URL是否匹配拦截规则
    function getMatchingRule(url) {
        return interceptConfig.rules.find(rule => {
            if (rule.urlPattern instanceof RegExp) {
                return rule.urlPattern.test(url);
            } else if (typeof rule.urlPattern === 'string') {
                return url.includes(rule.urlPattern);
            }
            return false;
        });
    }

    // 拦截fetch请求
    window.fetch = function(resource, init = {}) {
        const url = typeof resource === 'string' ? resource : resource.url;
        const matchingRule = getMatchingRule(url);

        if (matchingRule && init.body) {
            console.log('拦截到fetch请求:', url);
            console.log('原始请求体:', init.body);
            
            // 修改请求体
            init.body = matchingRule.modifyBody(init.body);
            
            console.log('修改后请求体:', init.body);
        }

        return originalFetch.apply(this, arguments);
    };

    // 拦截XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._url) {
            const matchingRule = getMatchingRule(this._url);
            
            if (matchingRule && body) {
                console.log('拦截到XMLHttpRequest请求:', this._url);
                console.log('原始请求体:', body);
                
                // 修改请求体
                body = matchingRule.modifyBody(body);
                
                console.log('修改后请求体:', body);
            }
        }

        return originalXHRSend.call(this, body);
    };

    // 添加配置管理功能
    window.tampermonkeyInterceptor = {
        // 打开配置页面
        openConfig: function() {
            createConfigPage();
        },
        
        // 获取当前配置
        getConfig: function() {
            return loadConfig();
        },
        
        // 重新加载配置（现在可以动态生效）
        reloadConfig: function() {
            const count = reloadInterceptConfig();
            console.log('配置已重新加载，无需刷新页面！当前规则数量:', count);
            return count;
        },
        
        // 添加新的拦截规则（兼容旧版本API）
        addRule: function(urlPattern, modifyBodyFunction) {
            const config = loadConfig();
            config.rules.push({
                name: '动态添加规则',
                urlPattern: urlPattern.toString(),
                isRegex: urlPattern instanceof RegExp,
                enabled: true,
                modifications: []
            });
            saveConfig(config);
            this.reloadConfig();
        },
        
        // 移除拦截规则
        removeRule: function(index) {
            const config = loadConfig();
            if (index >= 0 && index < config.rules.length) {
                config.rules.splice(index, 1);
                saveConfig(config);
                this.reloadConfig();
            }
        },
        
        // 查看当前规则
        getRules: function() {
            return loadConfig().rules;
        },
        
        // 清空所有规则
        clearRules: function() {
            saveConfig({ rules: [] });
            this.reloadConfig();
        }
    };

    console.log('HTTP请求拦截器已加载 (v3.0 - 支持动态配置)');
    console.log('当前拦截规则数量:', interceptConfig.rules.length);
    console.log('点击Tampermonkey菜单中的"配置拦截规则"来管理规则');
    console.log('或使用 window.tampermonkeyInterceptor.openConfig() 打开配置页面');
    console.log('配置变更后会立即生效，无需刷新页面！');

})();
