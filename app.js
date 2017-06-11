/**
 * 中国蚁剑::主程序入口
 * 更新：2016/05/02
 * 作者：蚁逅 <https://github.com/antoor>
 */

'use strict';

const path = require('path');
const electron = require('electron');
const { app, protocol, BrowserWindow } = require('electron');

protocol.registerStandardSchemes(['ant-static','ant-views','ant-src'], { secure: false });      

app.on('ready', () => {
    [
      ['static', '/static/', 13],
      ['views', '/views/', 12],   //- 通过访问访问ant-views来访问views 文件
      ['src', '/source/', 10]     //- 通过访问访问ant-src来访问source 文件
    ].map((_) => {
      protocol.registerFileProtocol(`ant-${_[0]}`, (req, cb) => {
        var requrl = req.url;
        var param = requrl.substr(_[2]);
        var char = param.substr(param.length-1,1)
        if(char == '/')
        {
          param = param.substring(0,param.length-1);
        }
        
        devToolsLog(path.join(__dirname,_[1],param));
        cb({
          path: path.join(__dirname,_[1],param),
        });
      });
    });
    
    // 初始化窗口
    let mainWindow = new BrowserWindow({
      width: 1040, height: 699,
      minWidth: 888, minHeight: 555,
      webgl: false, title: 'AntSword'
    });

    // 加载views
    mainWindow.loadURL('ant-views://index.html');

    // 调整部分UI
    const reloadUI = mainWindow.webContents.send.bind(
      mainWindow.webContents,
      'reloadui', true
    );

    // 窗口事件监听
    mainWindow
      .on('close', (event) => {
        event.preventDefault();
        app.exit(0);
      })
      .on('minimize', (event) => {
        event.preventDefault();
        if (process.platform == 'darwin') {
          app.hide();
        }else{
          mainWindow.hide();
        }
      })
      .on('resize', reloadUI)
      .on('maximize', reloadUI)
      .on('unmaximize', reloadUI)
      .on('enter-full-screen', reloadUI)
      .on('leave-full-screen', reloadUI);

   function devToolsLog(s) {
      console.log(s)
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.log("${s}")`)
      }
    };
    // 打开调试控制台
    mainWindow.webContents.openDevTools();
    devToolsLog('process args ' + process.argv.join(','))

    electron.Logger = require('./modules/logger')(mainWindow);
    // 初始化模块
    ['menubar', 'request', 'database', 'cache', 'update', 'plugStore'].map((_) => {
      new ( require(`./modules/${_}`) )(electron, app, mainWindow);
    });
  });
