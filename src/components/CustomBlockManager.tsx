import React, { useState, useEffect } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import './CustomBlockManager.css';

interface CustomBlock {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  inputs: BlockInput[];
  output: string | null;
  code: string;
}

interface BlockInput {
  name: string;
  type: 'field_input' | 'field_number' | 'field_dropdown' | 'input_value';
  label: string;
  defaultValue?: string;
  options?: string[][];
}

const CustomBlockManager: React.FC = () => {
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CustomBlock | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '自定义',
    color: '#FF9800',
    output: 'null' as string | null,
    code: '// 自定义代码\nreturn null;'
  });

  const [inputs, setInputs] = useState<BlockInput[]>([
    { name: 'input1', type: 'field_input', label: '输入1', defaultValue: '' }
  ]);

  // 加载保存的自定义积木块
  useEffect(() => {
    const savedBlocks = localStorage.getItem('smartdog_custom_blocks');
    if (savedBlocks) {
      try {
        const blocks = JSON.parse(savedBlocks);
        setCustomBlocks(blocks);
        registerCustomBlocks(blocks);
      } catch (error) {
        console.error('加载自定义积木块失败:', error);
      }
    }
  }, []);

  // 注册自定义积木块到Blockly
  const registerCustomBlocks = (blocks: CustomBlock[]) => {
    blocks.forEach(block => {
      const blockType = `custom_${block.id}`;
      
      // 如果积木块已经注册，先移除
      if (Blockly.Blocks[blockType]) {
        delete Blockly.Blocks[blockType];
        delete javascriptGenerator.forBlock[blockType];
      }

      // 创建积木块定义
      Blockly.Blocks[blockType] = {
        init: function() {
          const jsonConfig: any = {
            type: blockType,
            message0: block.name,
            colour: block.color,
            tooltip: block.description,
            helpUrl: ''
          };

          // 添加输入字段
          const args0: any[] = [];
          let message = block.name;
          
          block.inputs.forEach((input, index) => {
            const placeholder = `%${index + 1}`;
            message = message.replace(`{${input.name}}`, placeholder);
            
            switch (input.type) {
              case 'field_input':
                args0.push({
                  type: 'field_input',
                  name: input.name,
                  text: input.defaultValue || ''
                });
                break;
              case 'field_number':
                args0.push({
                  type: 'field_number',
                  name: input.name,
                  value: parseFloat(input.defaultValue || '0')
                });
                break;
              case 'field_dropdown':
                args0.push({
                  type: 'field_dropdown',
                  name: input.name,
                  options: input.options || [['选项1', 'option1']]
                });
                break;
              case 'input_value':
                args0.push({
                  type: 'input_value',
                  name: input.name,
                  check: 'String'
                });
                break;
            }
          });

          jsonConfig.message0 = message;
          jsonConfig.args0 = args0;

          // 设置输出类型
          if (block.output && block.output !== 'null') {
            jsonConfig.output = block.output;
          } else {
            jsonConfig.previousStatement = null;
            jsonConfig.nextStatement = null;
          }

          this.jsonInit(jsonConfig);
        }
      };

      // 注册代码生成器
      javascriptGenerator.forBlock[blockType] = function(blockInstance: any) {
        // 收集输入值
        const values: Record<string, any> = {};
        block.inputs.forEach(input => {
          if (input.type === 'field_input' || input.type === 'field_number' || input.type === 'field_dropdown') {
            values[input.name] = blockInstance.getFieldValue(input.name);
          } else if (input.type === 'input_value') {
            values[input.name] = javascriptGenerator.valueToCode(
              blockInstance, 
              input.name, 
              0
            ) || "''";
          }
        });

        // 替换代码中的变量
        let generatedCode = block.code;
        Object.entries(values).forEach(([key, value]) => {
          generatedCode = generatedCode.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        // 如果有输出，返回数组格式
        if (block.output && block.output !== 'null') {
          return [generatedCode, 0];
        }
        
        return generatedCode + '\n';
      };
    });
  };

  const handleInputChange = (index: number, field: keyof BlockInput, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setInputs(newInputs);
  };

  const addInput = () => {
    setInputs([...inputs, { 
      name: `input${inputs.length + 1}`, 
      type: 'field_input', 
      label: `输入${inputs.length + 1}`,
      defaultValue: ''
    }]);
  };

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      const newInputs = inputs.filter((_, i) => i !== index);
      setInputs(newInputs);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const blockId = editingBlock?.id || `block_${Date.now()}`;
    const newBlock: CustomBlock = {
      id: blockId,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      color: formData.color,
      inputs: inputs,
      output: formData.output === 'null' ? null : formData.output,
      code: formData.code
    };

    let updatedBlocks;
    if (editingBlock) {
      updatedBlocks = customBlocks.map(block => 
        block.id === editingBlock.id ? newBlock : block
      );
    } else {
      updatedBlocks = [...customBlocks, newBlock];
    }

    setCustomBlocks(updatedBlocks);
    localStorage.setItem('smartdog_custom_blocks', JSON.stringify(updatedBlocks));
    registerCustomBlocks([newBlock]);
    
    // 触发自定义积木块更新事件
    window.dispatchEvent(new CustomEvent('customBlocksUpdated'));
    
    // 重置表单
    setFormData({
      name: '',
      description: '',
      category: '自定义',
      color: '#FF9800',
      output: 'null',
      code: '// 自定义代码\nreturn null;'
    });
    setInputs([{ name: 'input1', type: 'field_input', label: '输入1', defaultValue: '' }]);
    setShowForm(false);
    setEditingBlock(null);
  };

  const editBlock = (block: CustomBlock) => {
    setFormData({
      name: block.name,
      description: block.description,
      category: block.category,
      color: block.color,
      output: block.output || 'null',
      code: block.code
    });
    setInputs(block.inputs);
    setEditingBlock(block);
    setShowForm(true);
  };

  const deleteBlock = (blockId: string) => {
    if (window.confirm('确定要删除这个自定义积木块吗？')) {
      const updatedBlocks = customBlocks.filter(block => block.id !== blockId);
      setCustomBlocks(updatedBlocks);
      localStorage.setItem('smartdog_custom_blocks', JSON.stringify(updatedBlocks));
      
      // 从Blockly中移除
      const blockType = `custom_${blockId}`;
      delete Blockly.Blocks[blockType];
      delete javascriptGenerator.forBlock[blockType];
      
      // 触发自定义积木块更新事件
      window.dispatchEvent(new CustomEvent('customBlocksUpdated'));
    }
  };

  const exportBlocks = () => {
    const dataStr = JSON.stringify(customBlocks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    // 生成描述性默认文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_').replace(/\..*$/, '');
    let exportFileDefaultName;
    if (customBlocks.length === 1) {
      // 如果只有一个积木块，使用其名称
      const blockName = customBlocks[0].name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      exportFileDefaultName = `custom_block_${blockName}_${timestamp}.json`;
    } else {
      // 多个积木块使用通用名称
      exportFileDefaultName = `custom_blocks_${timestamp}.json`;
    }
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importBlocks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedBlocks = JSON.parse(e.target?.result as string);
        const updatedBlocks = [...customBlocks, ...importedBlocks];
        setCustomBlocks(updatedBlocks);
        localStorage.setItem('smartdog_custom_blocks', JSON.stringify(updatedBlocks));
        registerCustomBlocks(importedBlocks);
        
        // 触发自定义积木块更新事件
        window.dispatchEvent(new CustomEvent('customBlocksUpdated'));
        alert('自定义积木块导入成功！');
      } catch (error) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="custom-block-manager">
      <div className="manager-header">
        <h3>自定义积木块管理</h3>
        <div className="header-actions">
          <button onClick={() => setShowForm(true)}>创建新积木块</button>
          <button onClick={exportBlocks}>导出积木块</button>
          <label className="import-button">
            导入积木块
            <input 
              type="file" 
              accept=".json" 
              onChange={importBlocks}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {showForm && (
        <div className="block-form-overlay">
          <div className="block-form">
            <div className="form-header">
              <h4>{editingBlock ? '编辑积木块' : '创建新积木块'}</h4>
              <button onClick={() => {
                setShowForm(false);
                setEditingBlock(null);
              }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>积木块名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="例如：前进 {duration} 秒"
                  required
                />
                <small>使用 {`{变量名}`} 表示输入字段</small>
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="积木块的功能描述"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>分类</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="自定义"
                  />
                </div>

                <div className="form-group">
                  <label>颜色</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>输出类型</label>
                  <select
                    value={formData.output || 'null'}
                    onChange={(e) => setFormData({...formData, output: e.target.value === 'null' ? null : e.target.value})}
                  >
                    <option value="null">无输出（语句块）</option>
                    <option value="Number">数字</option>
                    <option value="String">文本</option>
                    <option value="Boolean">布尔值</option>
                    <option value="Array">数组</option>
                  </select>
                </div>
              </div>

              <div className="inputs-section">
                <div className="section-header">
                  <h5>输入字段</h5>
                  <button type="button" onClick={addInput}>添加字段</button>
                </div>
                
                {inputs.map((input, index) => (
                  <div key={index} className="input-item">
                    <div className="input-row">
                      <input
                        type="text"
                        value={input.label}
                        onChange={(e) => handleInputChange(index, 'label', e.target.value)}
                        placeholder="字段标签"
                      />
                      <select
                        value={input.type}
                        onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                      >
                        <option value="field_input">文本输入</option>
                        <option value="field_number">数字输入</option>
                        <option value="field_dropdown">下拉选择</option>
                        <option value="input_value">值输入</option>
                      </select>
                      <input
                        type="text"
                        value={input.defaultValue || ''}
                        onChange={(e) => handleInputChange(index, 'defaultValue', e.target.value)}
                        placeholder="默认值"
                      />
                      {inputs.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeInput(index)}
                          className="remove-btn"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>代码生成器 *</label>
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="// 使用 {变量名} 引用输入字段
// 例如：dog.moveForward({duration});"
                  rows={6}
                  required
                />
                <small>使用 {`{变量名}`} 引用输入字段的值</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit">{editingBlock ? '更新' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="blocks-list">
        {customBlocks.length === 0 ? (
          <div className="empty-state">
            <p>还没有自定义积木块</p>
            <button onClick={() => setShowForm(true)}>创建第一个积木块</button>
          </div>
        ) : (
          <div className="blocks-grid">
            {customBlocks.map(block => (
              <div key={block.id} className="block-card" style={{ borderLeftColor: block.color }}>
                <div className="block-header">
                  <h5>{block.name}</h5>
                  <span className="block-category">{block.category}</span>
                </div>
                <p className="block-description">{block.description}</p>
                <div className="block-inputs">
                  <small>输入字段：{block.inputs.map(input => input.label).join(', ')}</small>
                </div>
                <div className="block-actions">
                  <button onClick={() => editBlock(block)}>编辑</button>
                  <button onClick={() => deleteBlock(block.id)} className="delete-btn">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomBlockManager;