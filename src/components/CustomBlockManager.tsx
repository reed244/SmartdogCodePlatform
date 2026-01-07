import React, { useState, useEffect } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { dataService, CustomBlockDefinition } from '../services/dataService';
import './CustomBlockManager.css';

// 兼容性类型定义
interface BlockInput {
  name: string;
  type: 'field_input' | 'field_number' | 'field_dropdown' | 'input_value';
  label: string;
  defaultValue?: string;
  options?: string[][];
}

const CustomBlockManager: React.FC = () => {
  const [customBlocks, setCustomBlocks] = useState<CustomBlockDefinition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CustomBlockDefinition | null>(null);
  
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
    const loadAndMigrateBlocks = () => {
      // 首先从dataService加载
      const currentData = dataService.getCurrentData();
      let blocks: CustomBlockDefinition[] = [];
      
      if (currentData && currentData.customBlocks.length > 0) {
        // 使用dataService中的数据
        blocks = currentData.customBlocks;
      } else {
        // 尝试从旧的localStorage格式迁移数据
        const savedBlocks = localStorage.getItem('smartdog_custom_blocks');
        if (savedBlocks) {
          try {
            const oldBlocks = JSON.parse(savedBlocks);
            // 转换旧格式到新格式
            blocks = oldBlocks.map((oldBlock: any) => ({
              id: oldBlock.id,
              name: oldBlock.name,
              description: oldBlock.description || '',
              category: oldBlock.category || '自定义',
              color: oldBlock.color || '#FF9800',
              inputs: oldBlock.inputs?.map((input: any) => ({
                type: input.type,
                name: input.name,
                label: input.label || input.name,
                value: input.defaultValue !== undefined ? input.defaultValue : input.value,
                options: input.options
              })) || [],
              code: oldBlock.code || '// 自定义代码\nreturn null;',
              output: oldBlock.output || null
            }));
            
            // 迁移到dataService
            if (blocks.length > 0) {
              dataService.updateCustomBlocks(blocks);
              // 清除旧的localStorage数据
              localStorage.removeItem('smartdog_custom_blocks');
              console.log('已迁移自定义积木块数据到dataService');
            }
          } catch (error) {
            console.error('迁移自定义积木块数据失败:', error);
          }
        }
      }
      
      if (blocks.length > 0) {
        setCustomBlocks(blocks);
        registerCustomBlocks(blocks);
      }
    };
    
    loadAndMigrateBlocks();
  }, []);

  // 注册自定义积木块到Blockly
  const registerCustomBlocks = (blocks: CustomBlockDefinition[]) => {
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
            tooltip: block.description || block.name,
            helpUrl: ''
          };

          // 添加输入字段
          const args0: any[] = [];
          let message = block.name;
          
          block.inputs.forEach((input, index) => {
            const placeholder = `%${index + 1}`;
            // 转义input.name中的正则表达式特殊字符
            const escapedName = input.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`\\{${escapedName}\\}`, 'g');
            
            // 检查消息中是否包含这个输入字段的占位符
            if (message.match(pattern)) {
              // 如果包含，进行全局替换
              message = message.replace(pattern, placeholder);
            } else {
              // 如果不包含，在消息末尾添加占位符
              // 确保消息末尾有空格分隔
              if (message.trim().length > 0 && !message.endsWith(' ')) {
                message += ' ';
              }
              message += placeholder;
            }
            
            switch (input.type) {
              case 'field_input':
                args0.push({
                  type: 'field_input',
                  name: input.name,
                  text: input.value !== undefined ? String(input.value) : ''
                });
                break;
              case 'field_number':
                args0.push({
                  type: 'field_number',
                  name: input.name,
                  value: input.value !== undefined ? Number(input.value) : 0
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
    
    // 转换输入格式为CustomBlockDefinition格式
    const convertedInputs = inputs.map(input => ({
      type: input.type,
      name: input.name,
      label: input.label,
      value: input.defaultValue,
      options: input.options
    }));
    
    const newBlock: CustomBlockDefinition = {
      id: blockId,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      color: formData.color,
      inputs: convertedInputs,
      code: formData.code,
      output: formData.output === 'null' ? null : formData.output
    };

    let updatedBlocks: CustomBlockDefinition[];
    if (editingBlock) {
      updatedBlocks = customBlocks.map(block => 
        block.id === editingBlock.id ? newBlock : block
      );
    } else {
      updatedBlocks = [...customBlocks, newBlock];
    }

    setCustomBlocks(updatedBlocks);
    // 更新到dataService
    dataService.updateCustomBlocks(updatedBlocks);
    registerCustomBlocks([newBlock]);
    
    // 注意：dataService.updateCustomBlocks()会触发'customBlocksChanged'事件
    // ScratchEditor.tsx监听该事件以更新工具箱
    
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

  const editBlock = (block: CustomBlockDefinition) => {
    setFormData({
      name: block.name,
      description: block.description || '',
      category: block.category,
      color: block.color,
      output: block.output || 'null',
      code: block.code
    });
    // 转换inputs格式为BlockInput[]
    const convertedInputs = block.inputs.map(input => ({
      name: input.name,
      type: input.type as 'field_input' | 'field_number' | 'field_dropdown' | 'input_value',
      label: input.label || input.name,
      defaultValue: input.value !== undefined ? String(input.value) : '',
      options: input.options as string[][]
    }));
    setInputs(convertedInputs);
    setEditingBlock(block);
    setShowForm(true);
  };

  const deleteBlock = (blockId: string) => {
    if (window.confirm('确定要删除这个自定义积木块吗？')) {
      const updatedBlocks = customBlocks.filter(block => block.id !== blockId);
      setCustomBlocks(updatedBlocks);
      // 更新到dataService
      dataService.updateCustomBlocks(updatedBlocks);
      
      // 从Blockly中移除
      const blockType = `custom_${blockId}`;
      delete Blockly.Blocks[blockType];
      delete javascriptGenerator.forBlock[blockType];
      
      // 注意：dataService.updateCustomBlocks()会触发'customBlocksChanged'事件
      // ScratchEditor.tsx监听该事件以更新工具箱
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
        // 验证导入的数据格式
        if (!Array.isArray(importedBlocks)) {
          throw new Error('导入的数据不是数组格式');
        }
        
        // 确保每个块都有必要的字段
        const validBlocks = importedBlocks.map((block: any) => ({
          id: block.id || `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: block.name || '未命名积木块',
          description: block.description,
          category: block.category || '自定义',
          color: block.color || '#FF9800',
          inputs: block.inputs || [],
          code: block.code || '// 自定义代码\nreturn null;',
          output: block.output
        }));
        
        const updatedBlocks = [...customBlocks, ...validBlocks];
        setCustomBlocks(updatedBlocks);
        // 更新到dataService
        dataService.updateCustomBlocks(updatedBlocks);
        registerCustomBlocks(validBlocks);
        
        alert('自定义积木块导入成功！');
      } catch (error) {
        alert(`导入失败：${error instanceof Error ? error.message : '文件格式不正确'}`);
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
                {block.description && <p className="block-description">{block.description}</p>}
                <div className="block-inputs">
                  <small>输入字段：{block.inputs.map(input => input.label || input.name).join(', ')}</small>
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