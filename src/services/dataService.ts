// 数据管理服务 - 只负责工作区数据和自定义积木块管理

// ==================== 数据类型定义 ====================

// 自定义积木块定义
export interface CustomBlockDefinition {
  id: string;                    // 积木块唯一标识
  name: string;                  // 积木块显示名称
  description?: string;          // 积木块描述（可选）
  category: string;              // 所属分类
  color: string;                 // 颜色（十六进制）
  inputs: Array<{                // 输入参数
    type: string;               // 参数类型 (field_input, field_number, field_dropdown, input_value, etc.)
    name: string;               // 参数名称
    label?: string;             // 显示标签（可选）
    value?: any;               // 默认值
    options?: any[];           // 下拉选项
  }>;
  code: string;                  // 生成的代码模板
  output?: string | null;       // 输出类型（可选，null表示无输出）
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
  name?: string;              // 工作区名称（可选）
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

  // ==================== 核心数据操作 ====================

  // 获取当前工作区数据
  getCurrentData(): WorkspaceData | null {
    return this.currentData;
  }

  // 初始化工作区数据
  initializeWorkspace(): WorkspaceData {
    this.currentData = {
      name: '未命名工作区',
      workspace: {
        xml: '',
        blocks: [],
        variables: [],
        functions: []
      },
      customBlocks: []
    };
    
    this.saveToLocalStorage();
    this.notifyWorkspaceChanged();
    this.notifyCustomBlocksChanged();
    return this.currentData;
  }

  // 更新工作区状态
  updateWorkspaceState(xml: string, blocks: any[], variables: string[], functions: any[]): void {
    if (!this.currentData) {
      this.currentData = this.initializeWorkspace();
    }
    
    this.currentData.workspace = { xml, blocks, variables, functions };
    this.saveToLocalStorage();
    this.notifyWorkspaceChanged();
  }

  // 更新自定义积木块
  updateCustomBlocks(customBlocks: CustomBlockDefinition[]): void {
    if (!this.currentData) {
      this.currentData = this.initializeWorkspace();
    }
    
    this.currentData.customBlocks = customBlocks;
    this.saveToLocalStorage();
    this.notifyCustomBlocksChanged();
  }

  // 添加单个自定义积木块
  addCustomBlock(block: CustomBlockDefinition): void {
    if (!this.currentData) {
      this.currentData = this.initializeWorkspace();
    }
    
    this.currentData.customBlocks.push(block);
    this.saveToLocalStorage();
    this.notifyCustomBlocksChanged();
  }

  // 删除自定义积木块
  removeCustomBlock(blockId: string): void {
    if (!this.currentData) return;
    
    this.currentData.customBlocks = this.currentData.customBlocks.filter(
      block => block.id !== blockId
    );
    
    this.saveToLocalStorage();
    this.notifyCustomBlocksChanged();
  }

  // ==================== 本地存储操作 ====================

  // 保存到localStorage
  private saveToLocalStorage(): void {
    if (!this.currentData) return;
    
    try {
      localStorage.setItem('smartdog_workspace_data', JSON.stringify(this.currentData));
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }

  // 从localStorage加载
  loadFromLocalStorage(): WorkspaceData | null {
    try {
      const savedData = localStorage.getItem('smartdog_workspace_data');
      if (!savedData) return null;
      
      const parsedData = JSON.parse(savedData);
      
      // 基本验证
      if (!parsedData.workspace || !parsedData.customBlocks) {
        console.warn('本地存储数据格式无效');
        return null;
      }
      
      this.currentData = {
        workspace: parsedData.workspace,
        customBlocks: parsedData.customBlocks || []
      };
      
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
    } catch (error) {
      console.error('清除本地存储失败:', error);
    }
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