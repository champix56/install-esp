(function(){"use strict";const{ipcRenderer:o,webFrame:i,contextBridge:f}=require("electron");function n(e){if(!e||!e.startsWith("vscode:"))throw new Error(`Unsupported event IPC channel '${e}'`);return!0}function a(e){if(e!=="uncaughtException")throw new Error(`Unsupported process event '${e}'`);return!0}function v(e){for(const r of process.argv)if(r.indexOf(`--${e}=`)===0)return r.split("=")[1]}let t;const c=(async()=>{const e=v("vscode-window-config");if(!e)throw new Error("Preload: did not find expected vscode-window-config in renderer process arguments list.");try{if(n(e))return t=await o.invoke(e),Object.assign(process.env,t.userEnv),i.setZoomLevel(t.zoomLevel??0),t}catch(r){throw new Error(`Preload: unable to fetch vscode-window-config: ${r}`)}})(),p=(async()=>{const[e,r]=await Promise.all([(async()=>(await c).userEnv)(),o.invoke("vscode:fetchShellEnv")]);return{...process.env,...r,...e}})(),u={ipcRenderer:{send(e,...r){n(e)&&o.send(e,...r)},invoke(e,...r){if(n(e))return o.invoke(e,...r)},on(e,r){if(n(e))return o.on(e,r),this},once(e,r){if(n(e))return o.once(e,r),this},removeListener(e,r){if(n(e))return o.removeListener(e,r),this}},ipcMessagePort:{connect(e,r,s){if(n(e)&&n(r)){const d=(g,w)=>{s===w&&(o.off(r,d),window.postMessage(s,"*",g.ports))};o.on(r,d),o.send(e,s)}}},webFrame:{setZoomLevel(e){typeof e=="number"&&i.setZoomLevel(e)}},process:{get platform(){return process.platform},get arch(){return process.arch},get env(){return{...process.env}},get versions(){return process.versions},get type(){return"renderer"},get execPath(){return process.execPath},get sandboxed(){return process.sandboxed},cwd(){return process.env.VSCODE_CWD||process.execPath.substr(0,process.execPath.lastIndexOf(process.platform==="win32"?"\\":"/"))},shellEnv(){return p},getProcessMemoryInfo(){return process.getProcessMemoryInfo()},on(e,r){if(a(e))return process.on(e,r),this}},context:{configuration(){return t},async resolveConfiguration(){return c}}};if(process.contextIsolated)try{f.exposeInMainWorld("vscode",u)}catch(e){console.error(e)}else window.vscode=u})();

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/6cba118ac49a1b88332f312a8f67186f7f3c1643/core/vs/base/parts/sandbox/electron-browser/preload.js.map