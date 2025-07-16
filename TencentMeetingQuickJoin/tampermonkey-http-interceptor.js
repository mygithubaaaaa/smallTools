// ==UserScript==
// @name         HTTP请求拦截器
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  拦截HTTP请求，支持修改请求体、请求头、域名替换和URL路径替换
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
                    ],
                    headerModifications: [
                        { key: 'X-Custom-Header', value: 'Hello-World', enabled: true }
                    ],
                    domainReplacement: {
                        enabled: false,
                        from: '',
                        to: '',
                        requireUrlMatch: false
                    },
                    urlPathReplacement: {
                        enabled: false,
                        replacement: ''
                    }
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

        window.addHeaderModification = function(ruleIndex) {
            if (!config.rules[ruleIndex].headerModifications) {
                config.rules[ruleIndex].headerModifications = [];
            }
            config.rules[ruleIndex].headerModifications.push({
                key: '',
                value: '',
                enabled: true
            });
            renderRules();
        };

        window.updateHeaderModification = function(ruleIndex, modIndex, field, value) {
            config.rules[ruleIndex].headerModifications[modIndex][field] = value;
        };

        window.removeHeaderModification = function(ruleIndex, modIndex) {
            config.rules[ruleIndex].headerModifications.splice(modIndex, 1);
            renderRules();
        };

        window.updateDomainReplacement = function(ruleIndex, field, value) {
            if (!config.rules[ruleIndex].domainReplacement) {
                config.rules[ruleIndex].domainReplacement = { enabled: false, from: '', to: '', requireUrlMatch: false };
            }
            config.rules[ruleIndex].domainReplacement[field] = value;
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
                    <div style="margin-top: 10px;">
                        <label style="font-weight: bold;">请求头修改:</label>
                        <div id="header_modifications_${index}" style="margin-left: 20px; margin-top: 5px;">
                            ${(rule.headerModifications || []).map((mod, modIndex) => `
                                <div style="margin-bottom: 8px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #f8f9fa;">
                                    <input type="text" value="${mod.key}" placeholder="请求头Key"
                                           data-action="updateHeaderModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="key"
                                           style="width: 150px; padding: 3px; margin-right: 5px; border: 1px solid #ccc; border-radius: 3px;">
                                    <input type="text" value="${mod.value}" placeholder="请求头Value"
                                           data-action="updateHeaderModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="value"
                                           style="width: 200px; padding: 3px; margin-right: 5px; border: 1px solid #ccc; border-radius: 3px;">
                                    <label style="margin-right: 10px;">
                                        <input type="checkbox" ${mod.enabled ? 'checked' : ''}
                                               data-action="updateHeaderModification" data-rule-index="${index}" data-mod-index="${modIndex}" data-field="enabled">
                                        启用
                                    </label>
                                    <button data-action="removeHeaderModification" data-rule-index="${index}" data-mod-index="${modIndex}"
                                            style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer;">
                                        删除
                                    </button>
                                </div>
                            `).join('')}
                            <button data-action="addHeaderModification" data-rule-index="${index}"
                                    style="background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">
                                添加请求头
                            </button>
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="font-weight: bold;">域名替换:</label>
                        <div style="margin-left: 20px; margin-top: 5px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #f8f9fa;">
                            <div style="margin-bottom: 5px;">
                                <label style="margin-right: 10px;">
                                    <input type="checkbox" ${rule.domainReplacement?.enabled ? 'checked' : ''}
                                           data-action="updateDomainReplacement" data-rule-index="${index}" data-field="enabled">
                                    启用
                                </label>
                                <label style="margin-right: 10px;">
                                    <input type="checkbox" ${rule.domainReplacement?.requireUrlMatch ? 'checked' : ''}
                                           data-action="updateDomainReplacement" data-rule-index="${index}" data-field="requireUrlMatch">
                                    仅当URL匹配时才进行域名替换
                                </label>
                            </div>
                            <div>
                                <input type="text" value="${rule.domainReplacement?.from || ''}" placeholder="原始域名 (e.g., api.example.com)"
                                       data-action="updateDomainReplacement" data-rule-index="${index}" data-field="from"
                                       style="width: 250px; padding: 3px; margin-right: 5px; border: 1px solid #ccc; border-radius: 3px;">
                                <span>=&gt;</span>
                                <input type="text" value="${rule.domainReplacement?.to || ''}" placeholder="目标域名 (e.g., api.dev.example.com)"
                                       data-action="updateDomainReplacement" data-rule-index="${index}" data-field="to"
                                       style="width: 250px; padding: 3px; margin-left: 5px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="font-weight: bold;">URL路径替换:</label>
                        <div style="margin-left: 20px; margin-top: 5px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #f8f9fa;">
                            <div style="margin-bottom: 5px;">
                                <label style="margin-right: 10px;">
                                    <input type="checkbox" ${rule.urlPathReplacement?.enabled ? 'checked' : ''}
                                           data-action="updateUrlPathReplacement" data-rule-index="${index}" data-field="enabled">
                                    启用URL路径替换
                                </label>
                                <span style="font-size: 12px; color: #666;">（将匹配到的URL部分替换为指定路径）</span>
                            </div>
                            <div>
                                <input type="text" value="${rule.urlPathReplacement?.replacement || ''}" placeholder="替换路径 (e.g., /api/v2/new-endpoint)"
                                       data-action="updateUrlPathReplacement" data-rule-index="${index}" data-field="replacement"
                                       style="width: 500px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
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
                case 'addHeaderModification':
                    if (!config.rules[ruleIndex].headerModifications) {
                        config.rules[ruleIndex].headerModifications = [];
                    }
                    config.rules[ruleIndex].headerModifications.push({ key: '', value: '', enabled: true });
                    renderRules();
                    break;
                case 'removeHeaderModification':
                    config.rules[ruleIndex].headerModifications.splice(modIndex, 1);
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
                case 'updateHeaderModification':
                    const headerModValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    config.rules[ruleIndex].headerModifications[modIndex][field] = headerModValue;
                    break;
                case 'updateDomainReplacement':
                    const domainValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    if (!config.rules[ruleIndex].domainReplacement) {
                        config.rules[ruleIndex].domainReplacement = { enabled: false, from: '', to: '', requireUrlMatch: false };
                    }
                    config.rules[ruleIndex].domainReplacement[field] = domainValue;
                    break;
                case 'updateUrlPathReplacement':
                    const urlPathValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    if (!config.rules[ruleIndex].urlPathReplacement) {
                        config.rules[ruleIndex].urlPathReplacement = { enabled: false, replacement: '' };
                    }
                    config.rules[ruleIndex].urlPathReplacement[field] = urlPathValue;
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
                modifications: [],
                headerModifications: [],
                domainReplacement: { enabled: false, from: '', to: '', requireUrlMatch: false },
                urlPathReplacement: { enabled: false, replacement: '' }
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
            headerModifications: (rule.headerModifications || []).filter(h => h.enabled && h.key),
            domainReplacement: rule.domainReplacement,
            urlPathReplacement: rule.urlPathReplacement,
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

    // 域名替换函数
    function replaceDomain(originalUrl, rule) {
        if (rule.domainReplacement && rule.domainReplacement.enabled && rule.domainReplacement.from && rule.domainReplacement.to) {
            try {
                // 使用当前页面URL作为base来处理相对URL和协议相对URL
                const urlObj = new URL(originalUrl, window.location.href);
                console.log(`[域名替换] 检查域名: ${urlObj.hostname} vs ${rule.domainReplacement.from}`);
                
                if (urlObj.hostname === rule.domainReplacement.from) {
                    const oldHostname = urlObj.hostname;
                    
                    // 使用字符串替换方法来确保域名替换生效
                    let newUrl;
                    if (originalUrl.startsWith('//')) {
                        // 协议相对URL：//example.com/path -> //newdomain.com/path
                        newUrl = '//' + rule.domainReplacement.to + urlObj.pathname + urlObj.search + urlObj.hash;
                    } else if (originalUrl.match(/^https?:\/\//)) {
                        // 完整URL：http://example.com/path -> http://newdomain.com/path
                        newUrl = urlObj.protocol + '//' + rule.domainReplacement.to + urlObj.pathname + urlObj.search + urlObj.hash;
                    } else {
                        // 其他情况，构建完整URL
                        newUrl = urlObj.protocol + '//' + rule.domainReplacement.to + urlObj.pathname + urlObj.search + urlObj.hash;
                    }
                    
                    console.log(`[域名替换] 成功替换: ${oldHostname} -> ${rule.domainReplacement.to}`);
                    console.log(`[域名替换] ${originalUrl} -> ${newUrl}`);
                    return newUrl;
                } else {
                    console.log(`[域名替换] 域名不匹配，跳过替换`);
                }
            } catch (e) {
                console.error('无效的URL，无法进行域名替换:', originalUrl, e);
            }
        }
        return originalUrl;
    }

    // 检查所有规则的域名替换
    function checkAllRulesForDomainReplacement(originalUrl) {
        for (const rule of interceptConfig.rules) {
            if (rule.domainReplacement && rule.domainReplacement.enabled && rule.domainReplacement.from && rule.domainReplacement.to) {
                // 如果设置了requireUrlMatch，则需要先检查URL是否匹配该规则
                if (rule.domainReplacement.requireUrlMatch) {
                    // 检查URL是否匹配该规则的URL模式
                    let urlMatches = false;
                    if (rule.urlPattern instanceof RegExp) {
                        urlMatches = rule.urlPattern.test(originalUrl);
                    } else if (typeof rule.urlPattern === 'string' && rule.urlPattern) {
                        urlMatches = originalUrl.includes(rule.urlPattern);
                    }
                    
                    if (!urlMatches) {
                        console.log(`[域名替换] 规则 "${rule.name}" 要求URL匹配，但URL不匹配，跳过域名替换`);
                        continue; // URL不匹配，跳过这个规则的域名替换
                    }
                }
                
                const newUrl = replaceDomain(originalUrl, rule);
                if (newUrl !== originalUrl) {
                    return { newUrl, rule };
                }
            }
        }
        return { newUrl: originalUrl, rule: null };
    }

    // URL路径替换函数
    function replaceUrlPath(originalUrl, rule) {
        if (rule.urlPathReplacement && rule.urlPathReplacement.enabled && rule.urlPathReplacement.replacement) {
            try {
                let newUrl = originalUrl;
                
                // 检查URL是否匹配该规则的URL模式
                if (rule.urlPattern instanceof RegExp) {
                    // 如果是正则表达式，使用replace方法
                    if (rule.urlPattern.test(originalUrl)) {
                        newUrl = originalUrl.replace(rule.urlPattern, rule.urlPathReplacement.replacement);
                        console.log(`[URL路径替换] 正则替换: ${originalUrl} -> ${newUrl}`);
                        return newUrl;
                    }
                } else if (typeof rule.urlPattern === 'string' && rule.urlPattern) {
                    // 如果是字符串模式，直接替换匹配的部分
                    if (originalUrl.includes(rule.urlPattern)) {
                        newUrl = originalUrl.replace(rule.urlPattern, rule.urlPathReplacement.replacement);
                        console.log(`[URL路径替换] 字符串替换: ${originalUrl} -> ${newUrl}`);
                        return newUrl;
                    }
                }
            } catch (e) {
                console.error('URL路径替换时出错:', originalUrl, e);
            }
        }
        return originalUrl;
    }

    // 检查匹配规则的URL路径替换
    function checkUrlPathReplacement(originalUrl, matchingRule) {
        if (matchingRule && matchingRule.urlPathReplacement && matchingRule.urlPathReplacement.enabled && matchingRule.urlPathReplacement.replacement) {
            return replaceUrlPath(originalUrl, matchingRule);
        }
        return originalUrl;
    }

    // 拦截fetch请求
    window.fetch = function(resource, init = {}) {
        let url = typeof resource === 'string' ? resource : resource.url;
        
        console.log('[Fetch拦截] 原始URL:', url);
        
        // 首先检查所有规则的域名替换
        const { newUrl, rule: domainRule } = checkAllRulesForDomainReplacement(url);
        if (newUrl !== url) {
            console.log('[Fetch拦截] 域名替换生效:', url, '->', newUrl);
            url = newUrl;
            if (typeof resource === 'object') {
                resource.url = url;
            } else {
                resource = url;
            }
        }
        
        // 然后用替换后的URL进行规则匹配
        const matchingRule = getMatchingRule(url);

        if (matchingRule) {
            console.log('拦截到fetch请求:', url);

            // 检查URL路径替换
            const newPathUrl = checkUrlPathReplacement(url, matchingRule);
            if (newPathUrl !== url) {
                console.log('[Fetch拦截] URL路径替换生效:', url, '->', newPathUrl);
                url = newPathUrl;
                if (typeof resource === 'object') {
                    resource.url = url;
                } else {
                    resource = url;
                }
            }

            // 修改请求头
            if (matchingRule.headerModifications && matchingRule.headerModifications.length > 0) {
                if (!init.headers) {
                    init.headers = {};
                }
                const headers = new Headers(init.headers);
                matchingRule.headerModifications.forEach(mod => {
                    console.log(`[Header] 设置: ${mod.key} = ${mod.value}`);
                    headers.set(mod.key, mod.value);
                });
                init.headers = headers;
            }

            // 修改请求体
            if (init.body) {
                console.log('原始请求体:', init.body);
                init.body = matchingRule.modifyBody(init.body);
                console.log('修改后请求体:', init.body);
            }
        }

        return originalFetch.apply(this, [resource, init]);
    };

    // 拦截XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._originalUrl = url;
        this._method = method;
        
        console.log('[XHR拦截] 原始URL:', url);
        
        // 首先检查所有规则的域名替换
        const { newUrl, rule: domainRule } = checkAllRulesForDomainReplacement(url);
        if (newUrl !== url) {
            console.log('[XHR拦截] 域名替换生效:', url, '->', newUrl);
            url = newUrl;
        }
        
        this._url = url;
        this._matchingRule = getMatchingRule(url); // 用替换后的URL进行规则匹配

        // 检查URL路径替换
        if (this._matchingRule) {
            const newPathUrl = checkUrlPathReplacement(this._url, this._matchingRule);
            if (newPathUrl !== this._url) {
                console.log('[XHR拦截] URL路径替换生效:', this._url, '->', newPathUrl);
                this._url = newPathUrl;
            }
        }

        return originalXHROpen.apply(this, [method, this._url, async, user, password]);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._matchingRule) {
            console.log('拦截到XMLHttpRequest请求:', this._url);

            // 请求头修改必须在send之前、open之后完成
            // setRequestHeader 必须在 open 之后调用
            // 我们无法在 open 时获取到所有 headers，所以在这里统一处理
            // 注意：这里我们无法读取已有的请求头，只能添加或覆盖
            if (this._matchingRule.headerModifications && this._matchingRule.headerModifications.length > 0) {
                 // 在这里设置请求头
                const originalSetRequestHeader = this.setRequestHeader;
                this._matchingRule.headerModifications.forEach(mod => {
                    console.log(`[Header] 设置: ${mod.key} = ${mod.value}`);
                    this.setRequestHeader(mod.key, mod.value);
                });
            }

            if (body) {
                console.log('原始请求体:', body);
                body = this._matchingRule.modifyBody(body);
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
                modifications: [],
                headerModifications: [],
                domainReplacement: { enabled: false, from: '', to: '', requireUrlMatch: false },
                urlPathReplacement: { enabled: false, replacement: '' }
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
