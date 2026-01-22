// 全局变量
let curType = "app";
let curAppType = "data";

// DOM元素获取函数
function $(id) {
    return document.getElementById(id);
}

// 初始化函数
function init() {
    // 绑定事件
    bindEvents();
    
    // 初始化描述符类型选择
    replaceType("app");
    
    // 初始化应用程序段类型选择
    switchAppType("data");
    
    // 更新系统段类型参数显示
    updateParams($("systypes").value);
    
    // 初始计算
    recalc();
}

// 绑定所有事件
function bindEvents() {
    // 描述符类型选择
    const typeOptions = document.querySelectorAll(".segment-type-option");
    typeOptions.forEach(option => {
        option.addEventListener("click", function() {
            const type = this.getAttribute("data-type");
            replaceType(type);
        });
    });
    
    // 应用程序段类型选择
    const appTypeOptions = document.querySelectorAll(".app-seg-type-option");
    appTypeOptions.forEach(option => {
        option.addEventListener("click", function() {
            const type = this.getAttribute("data-type");
            switchAppType(type);
        });
    });
    
    // 系统段类型选择
    $("systypes").addEventListener("change", function() {
        updateParams(this.value);
    });
    
    // 所有输入变化时自动计算
    const inputs = document.querySelectorAll("input, select");
    inputs.forEach(input => {
        input.addEventListener("change", recalc);
        if (input.type === "text" || input.type === "checkbox") {
            input.addEventListener("input", recalc);
        }
    });
    
    // 同步系统和应用程序段的已访问和粒度复选框
    $("accessed").addEventListener("change", function() {
        $("accessed_sys").checked = this.checked;
        recalc();
    });
    
    $("accessed_sys").addEventListener("change", function() {
        $("accessed").checked = this.checked;
        recalc();
    });
    
    $("granularity").addEventListener("change", function() {
        $("granularity_sys").checked = this.checked;
        recalc();
    });
    
    $("granularity_sys").addEventListener("change", function() {
        $("granularity").checked = this.checked;
        recalc();
    });

    // 基地址和界限输入框格式化（自动加0x、小写转大写）
    const hexInputs = [$("base"), $("limit"), $("base_tss"), $("limit_tss")];
    hexInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", formatHexInput);
            input.addEventListener("focus", function() {
                if (this.value === "0x0") {
                    this.setSelectionRange(2, 2);
                } else if (this.value.startsWith("0x")) {
                    this.setSelectionRange(this.value.length, this.value.length);
                }
            });
        }
    });
}

// 格式化十六进制输入（自动加小写0x前缀、十六进制字符大写、过滤非法字符）
function formatHexInput(event) {
    let input = event.target;
    let value = input.value.trim();
    
    // 确保前缀是小写的0x
    if (!value.startsWith('0x')) {
        // 移除可能的0X前缀，然后加小写0x
        value = '0x' + value.replace(/^0x|0X/, '');
    }
    
    // 去掉非十六进制字符（只保留0-9A-Fa-f和x）
    value = value.replace(/[^0-9A-Fa-fx]/g, '');
    
    // 把x后的字符转大写，保留x为小写
    const parts = value.split('x');
    if (parts.length === 2) {
        value = '0x' + parts[1].toUpperCase();
    } else {
        value = '0x0'; // 异常情况默认0x0
    }
    
    // 限制长度（maxlength已经设置，这里再过滤）
    if (value.length > input.maxLength) {
        value = value.substring(0, input.maxLength);
    }
    
    // 处理只有0x的情况
    if (value === '0x') {
        value = '0x0';
    }
    
    // 更新输入框值，保持光标位置
    const cursorPos = input.selectionStart;
    input.value = value;
    // 恢复光标位置（如果在0x之后）
    if (cursorPos <= 2) {
        input.setSelectionRange(2, 2);
    } else {
        // 光标位置不超过输入框长度
        const newPos = Math.min(cursorPos, value.length);
        input.setSelectionRange(newPos, newPos);
    }
}

// 切换描述符类型
function replaceType(type) {
    curType = type;
    
    // 更新UI
    const typeOptions = document.querySelectorAll(".segment-type-option");
    typeOptions.forEach(option => {
        if (option.getAttribute("data-type") === type) {
            option.classList.add("active");
        } else {
            option.classList.remove("active");
        }
    });
    
    // 显示/隐藏对应的参数面板
    if (type === "app") {
        $("appsegs").style.display = "block";
        $("syssegs").style.display = "none";
    } else {
        $("appsegs").style.display = "none";
        $("syssegs").style.display = "block";
    }
    
    // 重新计算
    recalc();
}

// 切换应用程序段类型
function switchAppType(type) {
    curAppType = type;
    
    // 更新UI
    const appTypeOptions = document.querySelectorAll(".app-seg-type-option");
    appTypeOptions.forEach(option => {
        if (option.getAttribute("data-type") === type) {
            option.classList.add("active");
        } else {
            option.classList.remove("active");
        }
    });
    
    // 显示/隐藏对应的参数
    if (type === "data") {
        $("data-seg-params").style.display = "block";
        $("code-seg-params").style.display = "none";
    } else {
        $("data-seg-params").style.display = "none";
        $("code-seg-params").style.display = "block";
        // 代码段强制取消向下扩展（代码段不支持向下扩展）
        $("expand").checked = false;
    }
    
    // 重新计算
    recalc();
}

// 更新系统段参数显示
function updateParams(value) {
    value = parseInt(value);
    
    // 根据系统段类型显示/隐藏相关参数
    switch (value) {
        case 1: // 286 Available TSS
        case 3: // 286 Busy TSS
        case 9: // 386 Available TSS
        case 11: // 386 Busy TSS
            $("callgate").style.display = "none";
            $("seloffs").style.display = "none";
            $("baseoffs").style.display = "flex";
            break;
        case 4: // 286 Call Gate
        case 12: // 386 Call Gate
            $("callgate").style.display = "block";
            $("seloffs").style.display = "flex";
            $("baseoffs").style.display = "none";
            break;
        default:
            $("callgate").style.display = "none";
            $("seloffs").style.display = "flex";
            $("baseoffs").style.display = "none";
            break;
    }
    
    // 重新计算
    recalc();
}

// 获取数值输入
function getVal(id) {
    const elem = $(id);
    if (!elem) return 0;
    
    const val = elem.value.trim();
    if (!val) return 0;
    
    // 尝试解析十六进制或十进制
    if (val.startsWith("0x") || val.startsWith("0X")) {
        return parseInt(val, 16) | 0;
    } else {
        return parseInt(val, 10) | 0;
    }
}

// 获取布尔值输入
function getBool(id) {
    const elem = $(id);
    return elem ? elem.checked : false;
}

// 格式化数组为十六进制字符串
function arr2s(arr, format) {
    const arr2 = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        arr2[i] = arr[i] >>> 0;
    }
    
    const lut = {2: 8, 4: 4, 8: 2};
    const l = lut[arr.length] || 2;
    const arr3 = [];
    
    for (let i = 0; i < arr.length; i++) {
        let elt = arr2[i].toString(16).toUpperCase();
        while (elt.length < l) elt = "0" + elt;
        arr3.push("0x" + elt);
    }
    
    return arr3.join(", ");
}

// 显示消息
function showMessage(message, type) {
    const msgArea = $("message-area");
    msgArea.textContent = message;
    msgArea.className = "message-area " + type;
}

// 清除消息
function clearMessage() {
    const msgArea = $("message-area");
    msgArea.textContent = "";
    msgArea.className = "message-area";
}

// 生成字节可视化
function generateByteVisualization(desc8) {
    const byteDescriptions = [
        "Limit 7:0",
        "Limit 15:8",
        "Base 7:0",
        "Base 15:8",
        "Base 23:16",
        "Type & DPL & P",
        "Limit 19:16 & Flags",
        "Base 31:24"
    ];
    
    let html = '<div style="display: flex; flex-wrap: wrap; justify-content: space-between;">';
    for (let i = 0; i < 8; i++) {
        const byteValue = desc8[i].toString(16).padStart(2, '0').toUpperCase();
        html += `
        <div class="byte-block">
            <div class="byte-header">字节 ${i}</div>
            <div class="byte-value">0x${byteValue}</div>
            <div class="byte-desc">${byteDescriptions[i]}</div>
        </div>
        `;
    }
    html += '</div>';
    
    return html;
}

// 计算段长度（严格按用户给出的最终规则）
function calculateSegmentLength(rawLimit, isExpandDown, granularity, is32Bit, segType) {
    // 1. 代码段强制为向上扩展（不支持向下扩展）
    if (segType === "code") {
        isExpandDown = false;
    }
    
    // 2. 确保rawLimit是20位有效范围（0x0 到 0xFFFFF）
    const limit20 = rawLimit & 0xFFFFF;
    let length = 0;
    let lowerBound = 0;
    
    if (!isExpandDown) {
        // ========== 向上扩展段（代码段/E=0数据段） ==========
        if (granularity === 0) {
            // G=0 字节粒度：长度 = Limit + 1
            length = limit20 + 1;
        } else {
            // G=1 4KB页粒度：长度 = (Limit + 1) × 4096
            length = (limit20 + 1) * 4096;
        }
    } else {
        // ========== 向下扩展段（仅E=1数据段） ==========
        if (granularity === 0) {
            // G=0 字节粒度：下限 = Limit + 1
            lowerBound = limit20 + 1;
        } else {
            // G=1 4KB页粒度：下限 = (Limit << 12) + 0x1000
            lowerBound = (limit20 << 12) + 0x1000;
        }

        // 计算最大偏移值
        const maxOffset = is32Bit ? 0x100000000 : 0x10000;
        
        // 当下限 >= 最大偏移时，段长度为0
        if (lowerBound >= maxOffset) {
            length = 0;
        } else {
            // 长度 = 最大偏移 - 下限
            length = maxOffset - lowerBound;
        }
    }

    // 3. 单位转换：严格按规则（<1KB→B，≥1KB<1MB→KB，≥1MB<1GB→MB，≥1GB→GB）
    if (length === 0) {
        return "0 B";
    } else if (length < 1024) {
        return `${length} B`;
    } else if (length < 1024 * 1024) {
        const kb = length / 1024;
        return `${kb.toFixed(2)} KB`;
    } else if (length < 1024 * 1024 * 1024) {
        const mb = length / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    } else {
        const gb = length / (1024 * 1024 * 1024);
        return `${gb.toFixed(2)} GB`;
    }
}

// 更新字段分析
function updateFieldAnalysis(desc8, base, rawLimit, isTSS, granularity, appType) {
    const typeByte = desc8[5];
    const flagsByte = desc8[6];
    
    // 提取字段
    const type = typeByte & 0x1F;
    const dpl = (typeByte >> 5) & 0x03;
    const present = (typeByte >> 7) & 0x01;
    
    const limitLow = (desc8[0] | (desc8[1] << 8)) & 0xFFFF;
    const limitHigh = flagsByte & 0x0F;
    const fullLimit = limitLow | (limitHigh << 16);
    
    const avl = (flagsByte >> 4) & 0x01;
    const sz = (flagsByte >> 6) & 0x01;
    const gran = (flagsByte >> 7) & 0x01;
    
    const baseLow = (desc8[2] | (desc8[3] << 8) | (desc8[4] << 16)) & 0xFFFFFF;
    const baseHigh = desc8[7];
    const fullBase = baseLow | (baseHigh << 24);
    
    // 更新基础字段显示
    $("field-base").textContent = "0x" + fullBase.toString(16).toUpperCase().padStart(8, '0');
    $("field-limit").textContent = "0x" + fullLimit.toString(16).toUpperCase().padStart(5, '0');
    $("field-type").textContent = "0x" + type.toString(16).toUpperCase() + " (" + getTypeDescription(type, curType, appType) + ")";
    $("field-dpl").textContent = dpl;
    $("field-present").textContent = present + (present ? " (存在)" : " (不存在)");
    $("field-granularity").textContent = gran + (gran ? " (4KB)" : " (1字节)");
    $("field-size").textContent = sz + (sz ? " (32位)" : " (16位)");
    $("field-avl").textContent = avl;
    
    // 计算并更新段长度
    if (curType === "app") {
        // 仅应用程序段计算长度
        const isExpandDown = (appType === "data") && getBool("expand");
        const is32Bit = getBool("sz");
        const segmentLength = calculateSegmentLength(rawLimit, isExpandDown, granularity, is32Bit, appType);
        $("field-length").textContent = segmentLength;
    } else {
        // 系统段长度无意义
        $("field-length").textContent = "不适用";
    }
    
    // 更新类型描述
    $("field-type-desc").textContent = getDetailedTypeDescription(type, curType, appType);
}

// 获取类型描述
function getTypeDescription(type, descType, appType) {
    if (descType === "app") {
        if (appType === "data") {
            return "数据段";
        } else {
            return "代码段";
        }
    } else {
        const sysTypes = {
            0: "无效0", 1: "286可用TSS", 2: "LDT", 3: "286忙TSS",
            4: "286调用门", 5: "任务门", 6: "286中断门", 7: "286陷阱门",
            8: "无效8", 9: "386可用TSS", 10: "无效A", 11: "386忙TSS",
            12: "386调用门", 13: "无效D", 14: "386中断门", 15: "386陷阱门"
        };
        return sysTypes[type] || "未知类型";
    }
}

// 获取详细类型描述
function getDetailedTypeDescription(type, descType, appType) {
    if (descType === "app") {
        if (appType === "data") {
            let desc = "数据段";
            if (type & 0x02) desc += "，可写";
            if (type & 0x04) desc += "，向下扩展";
            if (type & 0x01) desc += "，已访问";
            return desc;
        } else {
            let desc = "代码段";
            if (type & 0x02) desc += "，可读";
            if (type & 0x04) desc += "，一致段";
            if (type & 0x01) desc += "，已访问";
            return desc;
        }
    } else {
        return getTypeDescription(type, descType, appType);
    }
}

// 主计算函数
function recalc() {
    try {
        clearMessage();
        
        let base, limit, rawLimit, gran = 0;
        let isTSS = false;
        
        // 创建描述符数组
        const desc = new Int32Array(2);
        const desc16 = new Uint16Array(desc.buffer);
        const desc8 = new Uint8Array(desc.buffer);
        
        // 获取粒度设置
        let manualGran = 0;
        if (curType === "app") {
            manualGran = getBool("granularity") ? 1 : 0;
        } else {
            manualGran = getBool("granularity_sys") ? 1 : 0;
        }
        
        if (curType === "app") {
            // 应用程序段
            base = getVal("base");
            rawLimit = getVal("limit") >>> 0; // 保存原始界限值（未处理粒度）
            limit = rawLimit; // 用于描述符存储的界限值
            
            // 应用粒度（仅用于描述符存储，计算长度用rawLimit）
            gran = manualGran;
            if (gran === 1) {
                // 4KB粒度：界限字段存储页数-1（右移12位）
                if ((limit & 0xFFF) !== 0xFFF) {
                    showMessage("注意: 界限值不是4KB对齐，在使用4KB粒度时可能产生意外结果", "warning");
                }
                limit >>>= 12;
            }
            
            desc[0] = (limit & 0xFFFF) | ((base & 0xFFFF) << 16);
            desc8[4] = (base >> 16) & 0xFF;
            
            // 更新字段分析（传入原始limit值和粒度）
            updateFieldAnalysis(desc8, base, rawLimit, isTSS, manualGran, curAppType);
            
        } else {
            // 系统段
            const sysType = getVal("systypes");
            const tssSegs = [1, 3, 9, 11];
            isTSS = tssSegs.includes(sysType);
            
            if (isTSS) {
                // TSS类型
                base = getVal("base_tss");
                rawLimit = getVal("limit_tss") >>> 0; // 原始界限值
                limit = rawLimit;
                
                // 应用粒度
                gran = manualGran;
                if (gran === 1) {
                    if ((limit & 0xFFF) !== 0xFFF) {
                        showMessage("注意: 界限值不是4KB对齐，在使用4KB粒度时可能产生意外结果", "warning");
                    }
                    limit >>>= 12;
                }
                
                desc[0] = (limit & 0xFFFF) | ((base & 0xFFFF) << 16);
                desc8[4] = (base >> 16) & 0xFF;
                updateFieldAnalysis(desc8, base, rawLimit, isTSS, manualGran, curAppType);
            } else {
                // 门描述符
                const sel = getVal("sel");
                const offset = getVal("offset");
                
                desc16[1] = sel;
                desc16[0] = offset;
                desc8[4] = 0;
                updateFieldAnalysis(desc8, base, 0, isTSS, manualGran, curAppType);
            }
        }
        
        // 获取类型字段
        let typeVal = 0;
        
        if (curType === "app") {
            // 应用程序段类型
            let accessedVal = 0;
            if (curType === "app") {
                accessedVal = getBool("accessed") ? 1 : 0;
            } else {
                accessedVal = getBool("accessed_sys") ? 1 : 0;
            }
            typeVal = accessedVal;
            
            if (curAppType === "data") {
                if (getBool("writable")) typeVal |= 0x02;
                if (getBool("expand")) typeVal |= 0x04;
            } else {
                if (getBool("readable")) typeVal |= 0x02;
                if (getBool("conforming")) typeVal |= 0x04;
                typeVal |= 0x08; // 代码段
            }
            
            typeVal |= 0x10; // 代码/数据段描述符
        } else {
            // 系统段类型
            typeVal = getVal("systypes");
            
            // 调用门参数计数
            if ((typeVal & 7) === 4) { // 调用门类型
                desc8[4] = getVal("params") & 31;
            }
        }
        
        // 添加DPL和存在位
        const dpl = getVal("dpl") & 0x03;
        typeVal |= (dpl << 5);
        
        if (getBool("present")) {
            typeVal |= 0x80;
        }
        
        desc8[5] = typeVal;
        
        // 设置标志位
        if (curType === "app" || isTSS) {
            let flags = (limit >> 16) & 0x0F;
            
            if (!isTSS) {
                // 应用程序段的标志位
                if (getBool("avl")) flags |= 0x10;
                if (getBool("sz")) flags |= 0x40;
            }
            
            // 设置粒度位
            if (gran) flags |= 0x80;
            
            desc8[6] = flags;
            desc8[7] = (base >> 24) & 0xFF;
        } else {
            // 门描述符的偏移高位
            const offset = getVal("offset");
            desc16[3] = (offset >>> 16) & 0xFFFF;
        }
        
        // 显示结果
        $("dwords").textContent = arr2s(desc, 2);
        $("words").textContent = arr2s(desc16, 4);
        $("bytes").textContent = arr2s(desc8, 8);
        
        // 生成字节可视化
        $("byte-visualization").innerHTML = generateByteVisualization(desc8);
        
    } catch (error) {
        showMessage("计算错误: " + error.message, "error");
        console.error(error);
    }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", init);
