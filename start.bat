@echo off
echo Smart Dog Scratch编程平台启动脚本 (Windows)
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Python未安装
    echo 请先安装Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 运行Python启动脚本
echo 使用Python脚本启动...
python start.py

pause