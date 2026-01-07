#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Dog Scratch编程平台 - 跨平台启动脚本
支持 Linux, macOS, Windows
"""

import os
import sys
import subprocess
import time
import socket
import signal
import platform
from pathlib import Path

def check_node_installed():
    """检查Node.js是否安装"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            version_str = result.stdout.strip()
            # 提取主版本号
            version_num = int(version_str.split('v')[1].split('.')[0])
            if version_num < 14:
                print(f"警告: Node.js版本过低 (需要v14+)")
                print(f"当前版本: {version_str}")
                response = input("是否继续? (y/n): ").lower()
                if response != 'y':
                    return False
            return True
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    
    print("错误: Node.js未安装")
    print("请先安装Node.js: https://nodejs.org/")
    return False

def check_npm_installed():
    """检查npm是否安装"""
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, shell=True)
        return result.returncode == 0
    except (subprocess.SubprocessError, FileNotFoundError):
        print("错误: npm未安装")
        return False

def check_port_available(port):
    """检查端口是否可用（跨平台）"""
    try:
        # 尝试创建socket连接
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result != 0  # 0表示端口被占用
    except:
        return True

def install_dependencies(frontend=True, backend=True):
    """安装依赖"""
    current_dir = Path(__file__).parent
    
    if frontend:
        print("安装前端依赖...")
        frontend_dir = current_dir
        node_modules = frontend_dir / "node_modules"
        
        if not node_modules.exists():
            try:
                result = subprocess.run(['npm', 'install'], 
                                      cwd=str(frontend_dir),
                                      capture_output=True, text=True, shell=True)
                if result.returncode != 0:
                    print("前端依赖安装失败")
                    print(result.stderr)
                    return False
            except Exception as e:
                print(f"前端依赖安装出错: {e}")
                return False
    
    if backend:
        print("安装后端依赖...")
        backend_dir = current_dir / "backend"
        backend_node_modules = backend_dir / "node_modules"
        
        if not backend_node_modules.exists():
            try:
                result = subprocess.run(['npm', 'install'], 
                                      cwd=str(backend_dir),
                                      capture_output=True, text=True, shell=True)
                if result.returncode != 0:
                    print("后端依赖安装失败")
                    print(result.stderr)
                    return False
            except Exception as e:
                print(f"后端依赖安装出错: {e}")
                return False
    
    return True

def start_backend():
    """启动后端服务"""
    print("启动后端API服务 (端口: 8080, WebSocket: 8081)...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # 在后台启动后端
        if platform.system() == "Windows":
            backend_process = subprocess.Popen(['npm', 'start'], 
                                             cwd=str(backend_dir),
                                             creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
        else:
            backend_process = subprocess.Popen(['npm', 'start'], 
                                             cwd=str(backend_dir),
                                             start_new_session=True)
        
        # 等待后端启动
        print("等待后端服务启动...")
        time.sleep(3)
        
        # 检查后端是否启动成功
        import urllib.request
        try:
            urllib.request.urlopen('http://localhost:8080/api/status', timeout=2)
            print("后端服务启动成功")
            return backend_process
        except:
            print("后端服务启动失败")
            backend_process.terminate()
            return None
            
    except Exception as e:
        print(f"启动后端服务出错: {e}")
        return None

def start_frontend():
    """启动前端服务"""
    print("启动前端开发服务器 (端口: 3000)...")
    frontend_dir = Path(__file__).parent
    
    try:
        # 在后台启动前端
        if platform.system() == "Windows":
            frontend_process = subprocess.Popen(['npm', 'start'], 
                                              cwd=str(frontend_dir),
                                              creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
        else:
            frontend_process = subprocess.Popen(['npm', 'start'], 
                                              cwd=str(frontend_dir),
                                              start_new_session=True)
        
        # 等待前端启动
        print("等待前端服务启动...")
        time.sleep(5)
        
        # 检查前端是否启动成功
        import urllib.request
        try:
            urllib.request.urlopen('http://localhost:3000', timeout=2)
            print("前端服务启动成功")
            return frontend_process
        except:
            print("前端服务启动失败")
            frontend_process.terminate()
            return None
            
    except Exception as e:
        print(f"启动前端服务出错: {e}")
        return None

def main():
    """主函数"""
    print("启动 Smart Dog Scratch编程平台...")
    print(f"操作系统: {platform.system()} {platform.release()}")
    
    # 检查Node.js和npm
    if not check_node_installed():
        sys.exit(1)
    
    if not check_npm_installed():
        sys.exit(1)
    
    # 检查端口
    ports_to_check = [3000, 8080, 8081]
    for port in ports_to_check:
        if not check_port_available(port):
            print(f"错误: 端口 {port} 已被占用")
            print("请关闭占用该端口的程序，或修改配置")
            sys.exit(1)
    
    # 安装依赖
    if not install_dependencies():
        sys.exit(1)
    
    # 启动后端
    backend_process = start_backend()
    if not backend_process:
        sys.exit(1)
    
    # 启动前端
    frontend_process = start_frontend()
    if not frontend_process:
        backend_process.terminate()
        sys.exit(1)
    
    # 显示启动信息
    print("\n" + "="*40)
    print("Smart Dog Scratch编程平台启动成功！")
    print("="*40)
    print()
    print("访问地址: http://localhost:3000")
    print("API地址: http://localhost:8080")
    print("WebSocket: ws://localhost:8081")
    print()
    print("服务列表:")
    print(f"  - 前端: localhost:3000 (PID: {frontend_process.pid})")
    print(f"  - 后端: localhost:8080 (PID: {backend_process.pid})")
    print()
    print("按 Ctrl+C 停止所有服务")
    print("="*40)
    
    # 处理Ctrl+C信号
    def signal_handler(sig, frame):
        print("\n正在停止服务...")
        frontend_process.terminate()
        backend_process.terminate()
        # 等待进程结束
        frontend_process.wait()
        backend_process.wait()
        print("服务已停止")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # 保持脚本运行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()