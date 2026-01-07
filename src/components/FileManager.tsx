import React, { useState, useEffect } from 'react';
import './FileManager.css';
import { dataService, WorkspaceData } from '../services/dataService';

interface FileManagerProps {
  onDataLoaded?: (data: WorkspaceData) => void;
  onDataUpdated?: (data: WorkspaceData) => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  onDataLoaded,
  onDataUpdated
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentData, setCurrentData] = useState<WorkspaceData | null>(null);

  // 初始化：尝试从localStorage加载数据
  useEffect(() => {
    const savedData = dataService.loadFromLocalStorage();
    if (savedData) {
      setCurrentData(savedData);
      if (onDataLoaded) {
        onDataLoaded(savedData);
      }
      console.log('工作区数据已从本地存储加载');
    } else {
      // 如果没有保存的数据，初始化一个新的工作区
      const newData = dataService.initializeWorkspace();
      setCurrentData(newData);
      console.log('已初始化新的工作区数据');
    }

    // 监听工作区变化事件
    const handleWorkspaceChanged = (event: CustomEvent) => {
      const data = event.detail?.data;
      if (data) {
        setCurrentData(data);
      }
    };

    // 监听自定义积木块变化事件
    const handleCustomBlocksChanged = (event: CustomEvent) => {
      const customBlocks = event.detail?.customBlocks;
      if (currentData && customBlocks) {
        const updatedData = { ...currentData, customBlocks };
        setCurrentData(updatedData);
      }
    };

    window.addEventListener('workspaceChanged', handleWorkspaceChanged as EventListener);
    window.addEventListener('customBlocksChanged', handleCustomBlocksChanged as EventListener);

    return () => {
      window.removeEventListener('workspaceChanged', handleWorkspaceChanged as EventListener);
      window.removeEventListener('customBlocksChanged', handleCustomBlocksChanged as EventListener);
    };
  }, []);

  // 新建工作区
  const handleNewWorkspace = () => {
    if (window.confirm('是否创建新的工作区？当前工作区的更改将丢失。')) {
      const newData = dataService.initializeWorkspace();
      setCurrentData(newData);
      setShowMenu(false);
      
      if (onDataLoaded) {
        onDataLoaded(newData);
      }
      
      alert('已创建新的工作区');
    }
  };

  // 保存工作区数据到文件
  const handleSaveToFile = () => {
    const currentData = dataService.getCurrentData();
    if (!currentData) {
      alert('没有工作区数据可导出');
      return;
    }
    
    // 生成默认文件名：工作区名称 + 时间戳
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_').replace(/\..*$/, '');
    const workspaceName = currentData.name || 'smartdog_workspace';
    const defaultFilename = `${workspaceName}_${timestamp}.json`;
    const filename = prompt('请输入文件名:', defaultFilename);
    if (filename) {
      try {
        // 创建Blob对象
        const jsonContent = JSON.stringify(currentData, null, 2);
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
        
        alert(`工作区数据已保存为文件: ${filename}`);
      } catch (error) {
        alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  // 从文件加载工作区数据
  const handleLoadFromFile = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.smartdog';
    
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        try {
          const content = await readFileAsText(file);
          const importedData = JSON.parse(content);
          
          // 验证导入数据
          if (!importedData.workspace || !importedData.customBlocks) {
            throw new Error('文件格式无效：缺少工作区或自定义积木块数据');
          }
          
          // 更新数据服务
          dataService.updateWorkspaceState(
            importedData.workspace.xml,
            importedData.workspace.blocks || [],
            importedData.workspace.variables || [],
            importedData.workspace.functions || []
          );
          
          dataService.updateCustomBlocks(importedData.customBlocks || []);
          
          const loadedData = dataService.getCurrentData();
          if (loadedData) {
            setCurrentData(loadedData);
            setShowMenu(false);
            
            if (onDataLoaded) {
              onDataLoaded(loadedData);
            }
            
            alert(`工作区数据已从文件 "${file.name}" 加载`);
          }
        } catch (error) {
          alert(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    };
    
    fileInput.click();
  };

  // 读取文件为文本
  const readFileAsText = (file: File): Promise<string> => {
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
  };

  // 导出工作区为XML
  const handleExportWorkspaceXml = () => {
    if (!currentData) {
      alert('没有工作区数据可导出');
      return;
    }
    
    const xml = currentData.workspace.xml;
    if (!xml || xml.trim() === '') {
      alert('工作区为空，没有可导出的XML数据');
      return;
    }
    
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = 'workspace.xml';
    link.click();
    
    URL.revokeObjectURL(url);
    alert('工作区已导出为XML文件');
  };

  // 导入工作区XML
  const handleImportWorkspaceXml = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xml';
    
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        try {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            const xml = e.target?.result as string;
            if (xml && currentData) {
              // 更新工作区数据
              const updatedData = {
                ...currentData,
                workspace: {
                  ...currentData.workspace,
                  xml
                }
              };
              
              // 更新服务中的数据
              dataService.updateWorkspaceState(
                xml,
                updatedData.workspace.blocks,
                updatedData.workspace.variables,
                updatedData.workspace.functions
              );
              
              setCurrentData(updatedData);
              
              if (onDataUpdated) {
                onDataUpdated(updatedData);
              }
              
              alert('工作区已从XML文件导入');
            }
          };
          
          reader.readAsText(file);
        } catch (error) {
          alert(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    };
    
    fileInput.click();
  };

  // 保存到本地存储
  const handleSaveToLocalStorage = () => {
    if (!currentData) {
      alert('没有工作区数据可保存');
      return;
    }
    
    // 触发保存到localStorage
    dataService.updateWorkspaceState(
      currentData.workspace.xml,
      currentData.workspace.blocks,
      currentData.workspace.variables,
      currentData.workspace.functions
    );
    
    alert('工作区数据已保存到本地存储');
  };

  // 清除本地存储
  const handleClearLocalStorage = () => {
    if (window.confirm('确定要清除本地存储的工作区数据吗？这将删除所有保存的数据。')) {
      dataService.clearLocalStorage();
      const newData = dataService.initializeWorkspace();
      setCurrentData(newData);
      
      if (onDataLoaded) {
        onDataLoaded(newData);
      }
      
      alert('本地存储已清除，已创建新的工作区');
    }
  };

  // 获取工作区统计信息
  const getWorkspaceStats = () => {
    if (!currentData) {
      return null;
    }
    
    const { workspace, customBlocks } = currentData;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(workspace.xml || '<xml></xml>', 'text/xml');
    const blocks = xmlDoc.getElementsByTagName('block');
    
    return {
      blockCount: blocks.length,
      variableCount: workspace.variables.length,
      functionCount: workspace.functions.length,
      customBlockCount: customBlocks.length
    };
  };

  const workspaceStats = getWorkspaceStats();

  return (
    <div className="file-manager">
      <button 
        className="file-manager-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        📁 文件
      </button>
      
      {showMenu && (
        <div className="file-menu">
          <div className="file-menu-section">
            <h3>工作区操作</h3>
            <button onClick={handleNewWorkspace}>🆕 新建工作区</button>
            <button onClick={handleSaveToLocalStorage}>💾 保存到本地存储</button>
            <button onClick={handleSaveToFile}>📤 导出为文件</button>
            <button onClick={handleLoadFromFile}>📂 从文件导入</button>
            <button onClick={() => setShowInfo(true)}>ℹ️ 工作区信息</button>
          </div>
          
          <div className="file-menu-section">
            <h3>XML操作</h3>
            <button onClick={handleExportWorkspaceXml}>📤 导出工作区XML</button>
            <button onClick={handleImportWorkspaceXml}>📥 导入工作区XML</button>
          </div>
          
          <div className="file-menu-section">
            <h3>数据管理</h3>
            <button onClick={handleClearLocalStorage}>🗑️ 清除本地存储</button>
          </div>
        </div>
      )}
      
      {/* 工作区信息对话框 */}
      {showInfo && currentData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>工作区信息</h3>
              <button 
                className="modal-close"
                onClick={() => setShowInfo(false)}
              >
                ×
              </button>
            </div>
            
            <div className="project-info-content">
              <div className="info-section">
                <h4>工作区统计</h4>
                {workspaceStats && (
                  <>
                    <div className="info-row">
                      <span className="info-label">积木块数量:</span>
                      <span className="info-value">{workspaceStats.blockCount}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">变量数量:</span>
                      <span className="info-value">{workspaceStats.variableCount}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">函数数量:</span>
                      <span className="info-value">{workspaceStats.functionCount}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">自定义积木块:</span>
                      <span className="info-value">{workspaceStats.customBlockCount}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="info-section">
                <h4>自定义积木块</h4>
                {currentData.customBlocks.length === 0 ? (
                  <p className="empty-message">暂无自定义积木块</p>
                ) : (
                  <div className="custom-blocks-list">
                    {currentData.customBlocks.map((block, index) => (
                      <div key={block.id} className="custom-block-item">
                        <div 
                          className="block-color-indicator" 
                          style={{ backgroundColor: block.color }}
                        />
                        <div className="block-info">
                          <div className="block-name">{block.name}</div>
                          <div className="block-category">分类: {block.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setShowInfo(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
      
      {/* 当前工作区状态指示器 */}
      {currentData && (
        <div className="project-status">
          <span className="project-name">🧩 工作区</span>
          {workspaceStats && (
            <span className="block-count">积木块: {workspaceStats.blockCount}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManager;