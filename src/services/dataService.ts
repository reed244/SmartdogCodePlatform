// 数据管理服务 - 只负责工作区数据和自定义积木块管理

// ==================== 数据类型定义 ====================

// 自定义积木块定义
export interface CustomBlockDefinition {
  id: string;                    // 积木块唯一标识
  name: string;                  // 积木块显示名称
  category: string;              // 所属分类
  color: string;                 // 颜色（十六进制）
  inputs: Array<{                // 输入参数
    type: string;               // 参数类型 (field_number, field_text, etc.)
    name: string;               // 参数名称
    value?: any;               // 默认值
    options?: any[];           // 下拉选项
  }>;
  code: string;                  // 生成的代码模板
}

// 工作区状态
export interface WorkspaceState {
  xml: string;                  // Blockly XML
  blocks: any[];               // 所有积木块信息（序列化）
  variables: string[];         // 定义的变量
  functions: any[];            // 自定义函数
}

// 简化数据结构 - 只包含工作区和自定义积木块
export interface WorkspaceData {
  workspace: WorkspaceState;   // 工作区状态
  customBlocks: CustomBlockDefinition[]; // 自定义积木块
}

// ==================== 数据管理服务 ====================

class DataService {
  private static instance: DataService;
  private currentData: WorkspaceData | null = null;
  
  // 单例模式
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // ==================== 工作区数据操作 ====================

  // 获取当前工作区数据
  getCurrentData(): WorkspaceData | null {
    return this.currentData;
  }

  // 初始化或重置工作区数据
  initializeWorkspace(): WorkspaceData {
    this.currentData = {
      workspace: {
        xml: '',
        blocks: [],
        variables: [],
        functions: []
      },
      customBlocks: []
    };
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    return this.currentData;
  }

  // 更新工作区状态
  updateWorkspaceState(xml: string, blocks: any[], variables: string[], functions: any[]): void {
    if (!this.currentData) {
      this.currentData = this.initializeWorkspace();
    }
    
    this.currentData.workspace = {
      xml,
      blocks,
      variables,
      functions
    };
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    // 通知工作区变化
    this.notifyWorkspaceChanged();
  }

  // 更新自定义积木块
  updateCustomBlocks(customBlocks: CustomBlockDefinition[]): void {
    if (!this.currentData) {
      this.currentData = this.initializeWorkspace();
    }
    
    this.currentData.customBlocks = customBlocks;
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    // 通知自定义积木块更新
    this.notifyCustomBlocksChanged();
  }

  // 添加单个自定义积木块
  addCustomBlock(block: CustomBlockDefinition): void {
    if (!this.currentData) {
      this.currentData = this.initializeWorkspace();
    }
    
    this.currentData.customBlocks.push(block);
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    // 通知自定义积木块更新
    this.notifyCustomBlocksChanged();
  }

  // 删除自定义积木块
  removeCustomBlock(blockId: string): void {
    if (!this.currentData) {
      return;
    }
    
    this.currentData.customBlocks = this.currentData.customBlocks.filter(
      block => block.id !== blockId
    );
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    // 通知自定义积木块更新
    this.notifyCustomBlocksChanged();
  }

  // ==================== 本地存储操作 ====================

  // 保存到localStorage
  private saveToLocalStorage(): void {
    if (!this.currentData) {
      return;
    }
    
    try {
      localStorage.setItem('smartdog_workspace_data', JSON.stringify(this.currentData));
      console.log('工作区数据已保存到本地存储');
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }

  // 从localStorage加载
  loadFromLocalStorage(): WorkspaceData | null {
    try {
      const savedData = localStorage.getItem('smartdog_workspace_data');
      if (!savedData) {
        return null;
      }
      
      const parsedData = JSON.parse(savedData);
      
      // 基本验证
      if (!parsedData.workspace || !parsedData.customBlocks) {
        console.warn('本地存储数据格式无效，使用默认数据');
        return null;
      }
      
      this.currentData = {
        workspace: parsedData.workspace,
        customBlocks: parsedData.customBlocks || []
      };
      
      console.log('工作区数据已从本地存储加载');
      return this.currentData;
    } catch (error) {
      console.error('从本地存储加载失败:', error);
      return null;
    }
  }

  // 清除本地存储数据
  clearLocalStorage(): void {
    try {
      localStorage.removeItem('smartdog_workspace_data');
      this.currentData = null;
      console.log('本地存储数据已清除');
    } catch (error) {
      console.error('清除本地存储失败:', error);
    }
  }

  // ==================== 文件导入导出 ====================

  // 导出工作区数据为JSON文件
  exportToFile(filename: string = 'smartdog_workspace.json'): void {
    if (!this.currentData) {
      console.warn('没有工作区数据可导出');
      return;
    }
    
    try {
      // 创建Blob对象
      const jsonContent = JSON.stringify(this.currentData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 释放URL对象
      URL.revokeObjectURL(url);
      
      console.log('工作区数据已导出:', filename);
    } catch (error) {
      console.error('导出工作区数据失败:', error);
    }
  }

  // 从文件导入工作区数据
  async importFromFile(file: File): Promise<WorkspaceData> {
    try {
      const content = await this.readFileAsText(file);
      const importedData = JSON.parse(content);
      
      // 验证导入数据
      if (!importedData.workspace || !importedData.customBlocks) {
        throw new Error('文件格式无效：缺少工作区或自定义积木块数据');
      }
      
      // 设置当前数据
      this.currentData = {
        workspace: importedData.workspace,
        customBlocks: importedData.customBlocks || []
      };
      
      // 保存到localStorage
      this.saveToLocalStorage();
      
      // 通知数据已导入
      this.notifyWorkspaceChanged();
      this.notifyCustomBlocksChanged();
      
      console.log('工作区数据已从文件导入');
      return this.currentData;
    } catch (error) {
      console.error('导入工作区数据失败:', error);
      throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 读取文件为文本
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取错误'));
      };
      
      reader.readAsText(file);
    });
  }

  // ==================== 事件通知 ====================

  private notifyWorkspaceChanged(): void {
    const event = new CustomEvent('workspaceChanged', {
      detail: { data: this.currentData }
    });
    window.dispatchEvent(event);
  }

  private notifyCustomBlocksChanged(): void {
    const event = new CustomEvent('customBlocksChanged', {
      detail: { customBlocks: this.currentData?.customBlocks }
    });
    window.dispatchEvent(event);
  }
}

// 创建单例实例
export const dataService = DataService.getInstance();