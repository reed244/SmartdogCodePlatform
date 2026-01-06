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
};

// 立即注册自定义积木块
registerCustomBlocks();

// 定义小狗控制积木块
const ScratchEditor: React.FC = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (blocklyDiv.current && !workspaceRef.current) {

      // 创建Blockly工作区
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: {
          "kind": "categoryToolbox",
          "contents": [
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
        },
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
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
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