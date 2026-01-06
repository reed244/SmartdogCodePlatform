import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import './ScratchEditor.css';

// 在组件外部注册自定义积木块的代码生成器
// 这样确保在Blockly初始化之前就已经注册好了
const registerCustomBlocks = () => {
  // 注册积木块类型
  Blockly.Blocks['dog_move_forward'] = {
    init: function() {
      this.jsonInit({
        "type": "dog_move_forward",
        "message0": "前进 %1 秒",
        "args0": [
          {
            "type": "field_number",
            "name": "DURATION",
            "value": 1,
            "min": 0.1,
            "max": 10,
            "precision": 0.1
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "120",
        "tooltip": "让小狗前进指定秒数",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['dog_turn'] = {
    init: function() {
      this.jsonInit({
        "type": "dog_turn",
        "message0": "转向 %1 度",
        "args0": [
          {
            "type": "field_number",
            "name": "ANGLE",
            "value": 90,
            "min": -180,
            "max": 180
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "120",
        "tooltip": "让小狗转向指定角度",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['dog_bark'] = {
    init: function() {
      this.jsonInit({
        "type": "dog_bark",
        "message0": "叫一声",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "60",
        "tooltip": "让小狗叫一声",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['dog_wait'] = {
    init: function() {
      this.jsonInit({
        "type": "dog_wait",
        "message0": "等待 %1 秒",
        "args0": [
          {
            "type": "field_number",
            "name": "DURATION",
            "value": 1,
            "min": 0.1,
            "max": 10,
            "precision": 0.1
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "90",
        "tooltip": "等待指定秒数",
        "helpUrl": ""
      });
    }
  };

  // 注册代码生成器
  javascriptGenerator.forBlock['dog_move_forward'] = function(block: any) {
    const duration = block.getFieldValue('DURATION');
    return `dog.moveForward(${duration});\n`;
  };

  javascriptGenerator.forBlock['dog_turn'] = function(block: any) {
    const angle = block.getFieldValue('ANGLE');
    return `dog.turn(${angle});\n`;
  };

  javascriptGenerator.forBlock['dog_bark'] = function() {
    return 'dog.bark();\n';
  };

  javascriptGenerator.forBlock['dog_wait'] = function(block: any) {
    const duration = block.getFieldValue('DURATION');
    return `sleep(${duration * 1000});\n`;
  };

  // 数学运算积木块
  Blockly.Blocks['math_arithmetic'] = {
    init: function() {
      this.jsonInit({
        "type": "math_arithmetic",
        "message0": "%1 %2 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "A",
            "check": "Number"
          },
          {
            "type": "field_dropdown",
            "name": "OP",
            "options": [
              ["+", "ADD"],
              ["-", "MINUS"],
              ["×", "MULTIPLY"],
              ["÷", "DIVIDE"],
              ["^", "POWER"]
            ]
          },
          {
            "type": "input_value",
            "name": "B",
            "check": "Number"
          }
        ],
        "output": "Number",
        "colour": "230",
        "tooltip": "数学运算：加减乘除和幂运算",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['math_random_int'] = {
    init: function() {
      this.jsonInit({
        "type": "math_random_int",
        "message0": "随机整数从 %1 到 %2",
        "args0": [
          {
            "type": "input_value",
            "name": "FROM",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "TO",
            "check": "Number"
          }
        ],
        "output": "Number",
        "colour": "230",
        "tooltip": "生成指定范围内的随机整数",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['math_round'] = {
    init: function() {
      this.jsonInit({
        "type": "math_round",
        "message0": "四舍五入 %1",
        "args0": [
          {
            "type": "input_value",
            "name": "NUM",
            "check": "Number"
          }
        ],
        "output": "Number",
        "colour": "230",
        "tooltip": "对数字进行四舍五入",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['math_constrain'] = {
    init: function() {
      this.jsonInit({
        "type": "math_constrain",
        "message0": "限制 %1 在 %2 到 %3 之间",
        "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "LOW",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "HIGH",
            "check": "Number"
          }
        ],
        "output": "Number",
        "colour": "230",
        "tooltip": "将数值限制在指定范围内",
        "helpUrl": ""
      });
    }
  };

  // 数学运算代码生成器
  javascriptGenerator.forBlock['math_arithmetic'] = function(block: any) {
    const operator = block.getFieldValue('OP');
    const argument0 = javascriptGenerator.valueToCode(block, 'A', 0) || '0';
    const argument1 = javascriptGenerator.valueToCode(block, 'B', 0) || '0';
    
    let code;
    switch (operator) {
      case 'ADD':
        code = `(${argument0} + ${argument1})`;
        break;
      case 'MINUS':
        code = `(${argument0} - ${argument1})`;
        break;
      case 'MULTIPLY':
        code = `(${argument0} * ${argument1})`;
        break;
      case 'DIVIDE':
        code = `(${argument0} / ${argument1})`;
        break;
      case 'POWER':
        code = `Math.pow(${argument0}, ${argument1})`;
        break;
      default:
        code = '0';
    }
    return [code, 0];
  };

  javascriptGenerator.forBlock['math_random_int'] = function(block: any) {
    const argument0 = javascriptGenerator.valueToCode(block, 'FROM', 0) || '0';
    const argument1 = javascriptGenerator.valueToCode(block, 'TO', 0) || '1';
    const code = `Math.floor(Math.random() * (${argument1} - ${argument0} + 1) + ${argument0})`;
    return [code, 0];
  };

  javascriptGenerator.forBlock['math_round'] = function(block: any) {
    const argument0 = javascriptGenerator.valueToCode(block, 'NUM', 0) || '0';
    const code = `Math.round(${argument0})`;
    return [code, 0];
  };

  javascriptGenerator.forBlock['math_constrain'] = function(block: any) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '0';
    const low = javascriptGenerator.valueToCode(block, 'LOW', 0) || '0';
    const high = javascriptGenerator.valueToCode(block, 'HIGH', 0) || '100';
    const code = `Math.min(Math.max(${value}, ${low}), ${high})`;
    return [code, 0];
  };

  // 字符串处理积木块
  Blockly.Blocks['text_join'] = {
    init: function() {
      this.jsonInit({
        "type": "text_join",
        "message0": "连接文本",
        "args0": [],
        "output": "String",
        "colour": "160",
        "tooltip": "连接多个文本字符串",
        "helpUrl": ""
      });
      this.itemCount_ = 2;
      this.updateShape_();
    },
    updateShape_: function() {
      for (let i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          const input = this.appendValueInput('ADD' + i)
            .setCheck('String');
          if (i === 0) {
            input.appendField('文本');
          }
        }
      }
      if (this.getInput('ADD' + this.itemCount_)) {
        this.removeInput('ADD' + this.itemCount_);
      }
    },
    mutationToDom: function() {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },
    domToMutation: function(xmlElement: any) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
      this.updateShape_();
    }
  };

  Blockly.Blocks['text_length'] = {
    init: function() {
      this.jsonInit({
        "type": "text_length",
        "message0": "长度 %1",
        "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "String"
          }
        ],
        "output": "Number",
        "colour": "160",
        "tooltip": "获取文本字符串的长度",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['text_substring'] = {
    init: function() {
      this.jsonInit({
        "type": "text_substring",
        "message0": "子串 %1 从 %2 到 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "STRING",
            "check": "String"
          },
          {
            "type": "input_value",
            "name": "FROM",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "TO",
            "check": "Number"
          }
        ],
        "output": "String",
        "colour": "160",
        "tooltip": "获取文本的子字符串",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['text_contains'] = {
    init: function() {
      this.jsonInit({
        "type": "text_contains",
        "message0": "%1 包含 %2",
        "args0": [
          {
            "type": "input_value",
            "name": "TEXT",
            "check": "String"
          },
          {
            "type": "input_value",
            "name": "SUBSTRING",
            "check": "String"
          }
        ],
        "output": "Boolean",
        "colour": "160",
        "tooltip": "检查文本是否包含子字符串",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['text_change_case'] = {
    init: function() {
      this.jsonInit({
        "type": "text_change_case",
        "message0": "转换 %1 为 %2",
        "args0": [
          {
            "type": "input_value",
            "name": "TEXT",
            "check": "String"
          },
          {
            "type": "field_dropdown",
            "name": "CASE",
            "options": [
              ["大写", "UPPERCASE"],
              ["小写", "LOWERCASE"],
              ["首字母大写", "TITLECASE"]
            ]
          }
        ],
        "output": "String",
        "colour": "160",
        "tooltip": "转换文本的大小写",
        "helpUrl": ""
      });
    }
  };

  // 字符串处理代码生成器
  javascriptGenerator.forBlock['text_join'] = function(block: any) {
    const itemCount = block.itemCount_ || 2;
    const elements = [];
    for (let i = 0; i < itemCount; i++) {
      elements.push(javascriptGenerator.valueToCode(block, 'ADD' + i, 0) || "''");
    }
    const code = elements.join(' + ');
    return [code, 1];
  };

  javascriptGenerator.forBlock['text_length'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'VALUE', 0) || "''";
    const code = `${text}.length`;
    return [code, 18];
  };

  javascriptGenerator.forBlock['text_substring'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'STRING', 0) || "''";
    const from = javascriptGenerator.valueToCode(block, 'FROM', 0) || '0';
    const to = javascriptGenerator.valueToCode(block, 'TO', 0) || '0';
    const code = `${text}.substring(${from}, ${to})`;
    return [code, 19];
  };

  javascriptGenerator.forBlock['text_contains'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', 0) || "''";
    const substring = javascriptGenerator.valueToCode(block, 'SUBSTRING', 0) || "''";
    const code = `${text}.includes(${substring})`;
    return [code, 19];
  };

  javascriptGenerator.forBlock['text_change_case'] = function(block: any) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', 0) || "''";
    const caseType = block.getFieldValue('CASE');
    
    let code;
    switch (caseType) {
      case 'UPPERCASE':
        code = `${text}.toUpperCase()`;
        break;
      case 'LOWERCASE':
        code = `${text}.toLowerCase()`;
        break;
      case 'TITLECASE':
        code = `${text}.replace(/\\b\\w/g, char => char.toUpperCase())`;
        break;
      default:
        code = text;
    }
    return [code, 19];
  };

  // 数组操作积木块
  Blockly.Blocks['lists_create_with'] = {
    init: function() {
      this.jsonInit({
        "type": "lists_create_with",
        "message0": "创建数组",
        "args0": [],
        "output": "Array",
        "colour": "260",
        "tooltip": "创建包含多个元素的数组",
        "helpUrl": ""
      });
      this.itemCount_ = 0;
      this.updateShape_();
    },
    updateShape_: function() {
      for (let i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          const input = this.appendValueInput('ADD' + i);
          if (i === 0) {
            input.appendField('元素');
          }
        }
      }
      if (this.getInput('ADD' + this.itemCount_)) {
        this.removeInput('ADD' + this.itemCount_);
      }
    },
    mutationToDom: function() {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },
    domToMutation: function(xmlElement: any) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
      this.updateShape_();
    }
  };

  Blockly.Blocks['lists_get_index'] = {
    init: function() {
      this.jsonInit({
        "type": "lists_get_index",
        "message0": "获取数组 %1 的 %2 元素",
        "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Array"
          },
          {
            "type": "field_dropdown",
            "name": "WHERE",
            "options": [
              ["第一个", "FIRST"],
              ["最后一个", "LAST"],
              ["第", "FROM_START"],
              ["随机", "RANDOM"]
            ]
          }
        ],
        "output": null,
        "colour": "260",
        "tooltip": "获取数组中的元素",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['lists_set_index'] = {
    init: function() {
      this.jsonInit({
        "type": "lists_set_index",
        "message0": "设置数组 %1 的 %2 元素为 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "LIST",
            "check": "Array"
          },
          {
            "type": "field_dropdown",
            "name": "WHERE",
            "options": [
              ["第一个", "FIRST"],
              ["最后一个", "LAST"],
              ["第", "FROM_START"],
              ["随机", "RANDOM"]
            ]
          },
          {
            "type": "input_value",
            "name": "TO"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "260",
        "tooltip": "设置数组中的元素",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['lists_length'] = {
    init: function() {
      this.jsonInit({
        "type": "lists_length",
        "message0": "数组 %1 的长度",
        "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Array"
          }
        ],
        "output": "Number",
        "colour": "260",
        "tooltip": "获取数组的长度",
        "helpUrl": ""
      });
    }
  };

  Blockly.Blocks['lists_is_empty'] = {
    init: function() {
      this.jsonInit({
        "type": "lists_is_empty",
        "message0": "数组 %1 为空",
        "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Array"
          }
        ],
        "output": "Boolean",
        "colour": "260",
        "tooltip": "检查数组是否为空",
        "helpUrl": ""
      });
    }
  };

  // 数组操作代码生成器
  javascriptGenerator.forBlock['lists_create_with'] = function(block: any) {
    const itemCount = block.itemCount_ || 0;
    const elements = [];
    for (let i = 0; i < itemCount; i++) {
      elements.push(javascriptGenerator.valueToCode(block, 'ADD' + i, 0) || 'null');
    }
    const code = `[${elements.join(', ')}]`;
    return [code, 0];
  };

  javascriptGenerator.forBlock['lists_get_index'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', 18) || '[]';
    const where = block.getFieldValue('WHERE');
    
    let code;
    switch (where) {
      case 'FIRST':
        code = `${list}[0]`;
        break;
      case 'LAST':
        code = `${list}[${list}.length - 1]`;
        break;
      case 'FROM_START':
        const at = javascriptGenerator.valueToCode(block, 'AT', 0) || '0';
        code = `${list}[${at}]`;
        break;
      case 'RANDOM':
        code = `${list}[Math.floor(Math.random() * ${list}.length)]`;
        break;
      default:
        code = 'null';
    }
    return [code, 18];
  };

  javascriptGenerator.forBlock['lists_set_index'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', 18) || '[]';
    const where = block.getFieldValue('WHERE');
    const value = javascriptGenerator.valueToCode(block, 'TO', 0) || 'null';
    
    let code;
    switch (where) {
      case 'FIRST':
        code = `${list}[0] = ${value};\n`;
        break;
      case 'LAST':
        code = `${list}[${list}.length - 1] = ${value};\n`;
        break;
      case 'FROM_START':
        const at = javascriptGenerator.valueToCode(block, 'AT', 0) || '0';
        code = `${list}[${at}] = ${value};\n`;
        break;
      case 'RANDOM':
        code = `${list}[Math.floor(Math.random() * ${list}.length)] = ${value};\n`;
        break;
      default:
        code = '';
    }
    return code;
  };

  javascriptGenerator.forBlock['lists_length'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', 18) || '[]';
    const code = `${list}.length`;
    return [code, 18];
  };

  javascriptGenerator.forBlock['lists_is_empty'] = function(block: any) {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', 18) || '[]';
    const code = `${list}.length === 0`;
    return [code, 8];
  };
};

// 立即注册自定义积木块
registerCustomBlocks();

// 定义小狗控制积木块
const ScratchEditor: React.FC = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (blocklyDiv.current && !workspaceRef.current) {

      // 创建工具箱配置
      const toolboxConfig = {
        "kind": "categoryToolbox",
        "contents": [
          {
            "kind": "category",
            "name": "数学运算",
            "colour": "230",
            "contents": [
              {
                "kind": "block",
                "type": "math_number"
              },
              {
                "kind": "block",
                "type": "math_arithmetic"
              },
              {
                "kind": "block",
                "type": "math_random_int"
              },
              {
                "kind": "block",
                "type": "math_round"
              },
              {
                "kind": "block",
                "type": "math_constrain"
              }
            ]
          },
          {
            "kind": "category",
            "name": "文本处理",
            "colour": "160",
            "contents": [
              {
                "kind": "block",
                "type": "text"
              },
              {
                "kind": "block",
                "type": "text_join"
              },
              {
                "kind": "block",
                "type": "text_length"
              },
              {
                "kind": "block",
                "type": "text_substring"
              },
              {
                "kind": "block",
                "type": "text_contains"
              },
              {
                "kind": "block",
                "type": "text_change_case"
              }
            ]
          },
          {
            "kind": "category",
            "name": "数组操作",
            "colour": "260",
            "contents": [
              {
                "kind": "block",
                "type": "lists_create_with"
              },
              {
                "kind": "block",
                "type": "lists_get_index"
              },
              {
                "kind": "block",
                "type": "lists_set_index"
              },
              {
                "kind": "block",
                "type": "lists_length"
              },
              {
                "kind": "block",
                "type": "lists_is_empty"
              }
            ]
          },
          {
            "kind": "category",
            "name": "自定义积木块",
            "colour": "330",
            "contents": []  // 初始为空，动态加载
          },
          {
            "kind": "category",
            "name": "逻辑",
            "colour": "210",
            "contents": [
              {
                "kind": "block",
                "type": "controls_if"
              },
              {
                "kind": "block",
                "type": "logic_compare"
              },
              {
                "kind": "block",
                "type": "logic_operation"
              }
            ]
          },
          {
            "kind": "category",
            "name": "循环",
            "colour": "120",
            "contents": [
              {
                "kind": "block",
                "type": "controls_repeat_ext"
              },
              {
                "kind": "block",
                "type": "controls_whileUntil"
              }
            ]
          },
          {
            "kind": "category",
            "name": "小狗控制",
            "colour": "60",
            "contents": [
              {
                "kind": "block",
                "type": "dog_move_forward"
              },
              {
                "kind": "block",
                "type": "dog_turn"
              },
              {
                "kind": "block",
                "type": "dog_bark"
              },
              {
                "kind": "block",
                "type": "dog_wait"
              }
            ]
          },
          {
            "kind": "category",
            "name": "变量",
            "colour": "330",
            "custom": "VARIABLE"
          },
          {
            "kind": "category",
            "name": "函数",
            "colour": "290",
            "custom": "PROCEDURE"
          }
        ]
      };

      // 动态加载自定义积木块
      const loadCustomBlocks = () => {
        try {
          const savedBlocks = localStorage.getItem('smartdog_custom_blocks');
          if (savedBlocks) {
            const customBlocks = JSON.parse(savedBlocks);
            
            // 为每个自定义积木块创建工具箱条目
            const customCategoryIndex = toolboxConfig.contents.findIndex(
              (cat: any) => cat.name === '自定义积木块'
            );
            
            if (customCategoryIndex !== -1) {
              toolboxConfig.contents[customCategoryIndex].contents = customBlocks.map((block: any) => ({
                kind: 'block',
                type: `custom_${block.id}`
              }));
            }
          }
        } catch (error) {
          console.error('加载自定义积木块失败:', error);
        }
      };

      // 监听自定义积木块更新
      const handleCustomBlocksUpdate = () => {
        loadCustomBlocks();
        if (workspaceRef.current) {
          workspaceRef.current.updateToolbox(toolboxConfig);
        }
      };

      // 初始加载自定义积木块
      loadCustomBlocks();

      // 创建Blockly工作区
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxConfig,
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        },
        trashcan: true,
        horizontalLayout: false,
        toolboxPosition: 'start',
        css: true,
        renderer: 'zelos',
        theme: Blockly.Themes.Zelos
      });

      window.addEventListener('customBlocksUpdated', handleCustomBlocksUpdate);

      // 添加上下文菜单（右键菜单）支持断点
      if (workspaceRef.current) {
        workspaceRef.current.addChangeListener((event: any) => {
          if (event.type === Blockly.Events.CLICK && event.targetType === 'block') {
            const block = workspaceRef.current?.getBlockById(event.blockId);
            if (block && event.button === 2) { // 右键点击
              // 触发断点切换事件
              const breakpointEvent = new CustomEvent('toggleBreakpoint', {
                detail: { blockId: event.blockId }
              });
              window.dispatchEvent(breakpointEvent);
            }
          }
        });
      }

      // 添加初始积木块示例
      const initialXml = `
        <xml xmlns="http://www.w3.org/1999/xhtml">
          <block type="dog_move_forward" x="50" y="50">
            <field name="DURATION">2</field>
          </block>
          <block type="dog_turn" x="50" y="150">
            <field name="ANGLE">90</field>
          </block>
          <block type="dog_bark" x="50" y="250"></block>
        </xml>
      `;
      
      const parser = new DOMParser();
      const xmlDom = parser.parseFromString(initialXml, 'text/xml');
      Blockly.Xml.domToWorkspace(xmlDom.documentElement, workspaceRef.current!);

      return () => {
        if (workspaceRef.current) {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        }
        window.removeEventListener('customBlocksUpdated', handleCustomBlocksUpdate);
      };
    }
  }, []);

  const generateCode = () => {
    if (workspaceRef.current) {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      // 触发自定义事件传递生成的代码
      const event = new CustomEvent('codeGenerated', { detail: { code } });
      window.dispatchEvent(event);
      return code;
    }
    return '';
  };

  const clearWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current.clear();
    }
  };

  const saveWorkspace = () => {
    if (workspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);
      localStorage.setItem('smartdog_workspace', xmlText);
      alert('工作区已保存到本地存储');
    }
  };

  const loadWorkspace = () => {
    if (workspaceRef.current) {
      const saved = localStorage.getItem('smartdog_workspace');
      if (saved) {
        const parser = new DOMParser();
        const xmlDom = parser.parseFromString(saved, 'text/xml');
        workspaceRef.current.clear();
        Blockly.Xml.domToWorkspace(xmlDom.documentElement, workspaceRef.current);
        alert('工作区已从本地存储加载');
      } else {
        alert('没有找到保存的工作区');
      }
    }
  };

  return (
    <div className="scratch-editor">
      <div className="editor-toolbar">
        <button onClick={generateCode}>生成代码</button>
        <button onClick={clearWorkspace}>清空工作区</button>
        <button onClick={saveWorkspace}>保存工作区</button>
        <button onClick={loadWorkspace}>加载工作区</button>
      </div>
      <div ref={blocklyDiv} className="blockly-container" />
      <div className="editor-info">
        <p>使用说明：拖拽积木块到工作区，连接它们来创建程序</p>
        <p>小狗控制积木块可以控制智能小狗的运动和行为</p>
      </div>
    </div>
  );
};

export default ScratchEditor;