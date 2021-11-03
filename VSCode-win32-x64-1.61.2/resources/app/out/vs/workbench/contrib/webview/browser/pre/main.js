const isSafari=navigator.vendor&&navigator.vendor.indexOf("Apple")>-1&&navigator.userAgent&&navigator.userAgent.indexOf("CriOS")===-1&&navigator.userAgent.indexOf("FxiOS")===-1,isFirefox=navigator.userAgent&&navigator.userAgent.indexOf("Firefox")>=0,searchParams=new URL(location.toString()).searchParams,ID=searchParams.get("id"),onElectron=searchParams.get("platform")==="electron",expectedWorkerVersion=parseInt(searchParams.get("swVersion")),parentOrigin=searchParams.get("parentOrigin"),trackFocus=({onFocus:e,onBlur:t})=>{const r=50;let o=document.hasFocus();setInterval(()=>{const n=document.hasFocus();n!==o&&(o=n,n?e():t())},r)},getActiveFrame=()=>document.getElementById("active-frame"),getPendingFrame=()=>document.getElementById("pending-frame");function assertIsDefined(e){if(typeof e=="undefined"||e===null)throw new Error("Found unexpected null");return e}const vscodePostMessageFuncName="__vscode_post_message__",defaultStyles=document.createElement("style");defaultStyles.id="_defaultStyles",defaultStyles.textContent=`
	html {
		scrollbar-color: var(--vscode-scrollbarSlider-background) var(--vscode-editor-background);
	}

	body {
		background-color: transparent;
		color: var(--vscode-editor-foreground);
		font-family: var(--vscode-font-family);
		font-weight: var(--vscode-font-weight);
		font-size: var(--vscode-font-size);
		margin: 0;
		padding: 0 20px;
	}

	img {
		max-width: 100%;
		max-height: 100%;
	}

	a, a code {
		color: var(--vscode-textLink-foreground);
	}

	a:hover {
		color: var(--vscode-textLink-activeForeground);
	}

	a:focus,
	input:focus,
	select:focus,
	textarea:focus {
		outline: 1px solid -webkit-focus-ring-color;
		outline-offset: -1px;
	}

	code {
		color: var(--vscode-textPreformat-foreground);
	}

	blockquote {
		background: var(--vscode-textBlockQuote-background);
		border-color: var(--vscode-textBlockQuote-border);
	}

	kbd {
		color: var(--vscode-editor-foreground);
		border-radius: 3px;
		vertical-align: middle;
		padding: 1px 3px;

		background-color: hsla(0,0%,50%,.17);
		border: 1px solid rgba(71,71,71,.4);
		border-bottom-color: rgba(88,88,88,.4);
		box-shadow: inset 0 -1px 0 rgba(88,88,88,.4);
	}
	.vscode-light kbd {
		background-color: hsla(0,0%,87%,.5);
		border: 1px solid hsla(0,0%,80%,.7);
		border-bottom-color: hsla(0,0%,73%,.7);
		box-shadow: inset 0 -1px 0 hsla(0,0%,73%,.7);
	}

	::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	::-webkit-scrollbar-corner {
		background-color: var(--vscode-editor-background);
	}

	::-webkit-scrollbar-thumb {
		background-color: var(--vscode-scrollbarSlider-background);
	}
	::-webkit-scrollbar-thumb:hover {
		background-color: var(--vscode-scrollbarSlider-hoverBackground);
	}
	::-webkit-scrollbar-thumb:active {
		background-color: var(--vscode-scrollbarSlider-activeBackground);
	}`;function getVsCodeApiScript(e,t){const r=t?encodeURIComponent(t):void 0;return`
			globalThis.acquireVsCodeApi = (function() {
				const originalPostMessage = window.parent['${vscodePostMessageFuncName}'].bind(window.parent);
				const doPostMessage = (channel, data, transfer) => {
					originalPostMessage(channel, data, transfer);
				};

				let acquired = false;

				let state = ${t?`JSON.parse(decodeURIComponent("${r}"))`:void 0};

				return () => {
					if (acquired && !${e}) {
						throw new Error('An instance of the VS Code API has already been acquired');
					}
					acquired = true;
					return Object.freeze({
						postMessage: function(message, transfer) {
							doPostMessage('onmessage', { message, transfer }, transfer);
						},
						setState: function(newState) {
							state = newState;
							doPostMessage('do-update-state', JSON.stringify(newState));
							return newState;
						},
						getState: function() {
							return state;
						}
					});
				};
			})();
			delete window.parent;
			delete window.top;
			delete window.frameElement;
		`}const workerReady=new Promise((e,t)=>{if(!areServiceWorkersEnabled())return t(new Error("Service Workers are not enabled. Webviews will not work. Try disabling private/incognito mode."));const r=`service-worker.js${self.location.search}`;navigator.serviceWorker.register(r).then(async o=>{await navigator.serviceWorker.ready;const n=async d=>{if(d.data.channel==="version")return navigator.serviceWorker.removeEventListener("message",n),d.data.version===expectedWorkerVersion?e():(console.log(`Found unexpected service worker version. Found: ${d.data.version}. Expected: ${expectedWorkerVersion}`),console.log("Attempting to reload service worker"),o.unregister().then(()=>navigator.serviceWorker.register(r)).then(()=>navigator.serviceWorker.ready).finally(()=>{e()}))};navigator.serviceWorker.addEventListener("message",n);const i=()=>{assertIsDefined(navigator.serviceWorker.controller).postMessage({channel:"version"})},u=navigator.serviceWorker.controller;if(u&&u.scriptURL.endsWith(r))i();else{const d=()=>{navigator.serviceWorker.removeEventListener("controllerchange",d),i()};navigator.serviceWorker.addEventListener("controllerchange",d)}},o=>{t(new Error(`Could not register service workers: ${o}.`))})}),hostMessaging=new class{constructor(){this.handlers=new Map,window.addEventListener("message",t=>{if(t.origin!==parentOrigin){console.log(`skipping webview message due to mismatched origins: ${t.origin} ${parentOrigin}`);return}const r=t.data.channel,o=this.handlers.get(r);if(o)for(const n of o)n(t,t.data.args);else console.log("no handler for ",t)})}postMessage(t,r){window.parent.postMessage({target:ID,channel:t,data:r},parentOrigin)}onMessage(t,r){let o=this.handlers.get(t);o||(o=[],this.handlers.set(t,o)),o.push(r)}},unloadMonitor=new class{constructor(){this.confirmBeforeClose="keyboardOnly",this.isModifierKeyDown=!1,hostMessaging.onMessage("set-confirm-before-close",(e,t)=>{this.confirmBeforeClose=t}),hostMessaging.onMessage("content",(e,t)=>{this.confirmBeforeClose=t.confirmBeforeClose}),window.addEventListener("beforeunload",e=>{if(!onElectron)switch(this.confirmBeforeClose){case"always":return e.preventDefault(),e.returnValue="","";case"never":break;case"keyboardOnly":default:{if(this.isModifierKeyDown)return e.preventDefault(),e.returnValue="","";break}}})}onIframeLoaded(e){e.contentWindow.addEventListener("keydown",t=>{this.isModifierKeyDown=t.metaKey||t.ctrlKey||t.altKey}),e.contentWindow.addEventListener("keyup",()=>{this.isModifierKeyDown=!1})}};let firstLoad=!0,loadTimeout,styleVersion=0,pendingMessages=[];const initData={initialScrollProgress:void 0,styles:void 0,activeTheme:void 0,themeName:void 0};hostMessaging.onMessage("did-load-resource",(e,t)=>{navigator.serviceWorker.ready.then(r=>{assertIsDefined(r.active).postMessage({channel:"did-load-resource",data:t},t.data?.buffer?[t.data.buffer]:[])})}),hostMessaging.onMessage("did-load-localhost",(e,t)=>{navigator.serviceWorker.ready.then(r=>{assertIsDefined(r.active).postMessage({channel:"did-load-localhost",data:t})})}),navigator.serviceWorker.addEventListener("message",e=>{switch(e.data.channel){case"load-resource":case"load-localhost":hostMessaging.postMessage(e.data.channel,e.data);return}});const applyStyles=(e,t)=>{if(!!e&&(t&&(t.classList.remove("vscode-light","vscode-dark","vscode-high-contrast"),initData.activeTheme&&t.classList.add(initData.activeTheme),t.dataset.vscodeThemeKind=initData.activeTheme,t.dataset.vscodeThemeName=initData.themeName||""),initData.styles)){const r=e.documentElement.style;for(let o=r.length-1;o>=0;o--){const n=r[o];n&&n.startsWith("--vscode-")&&r.removeProperty(n)}for(const o of Object.keys(initData.styles))r.setProperty(`--${o}`,initData.styles[o])}},handleInnerClick=e=>{if(!e||!e.view||!e.view.document)return;const t=e.view.document.getElementsByTagName("base")[0];for(const r of e.composedPath()){const o=r;if(o.tagName&&o.tagName.toLowerCase()==="a"&&o.href){if(o.getAttribute("href")==="#")e.view.scrollTo(0,0);else if(o.hash&&(o.getAttribute("href")===o.hash||t&&o.href===t.href+o.hash)){const n=e.view.document.getElementById(o.hash.substr(1,o.hash.length-1));n&&n.scrollIntoView()}else hostMessaging.postMessage("did-click-link",o.href.baseVal||o.href);e.preventDefault();return}}},handleAuxClick=e=>{if(!(!e.view||!e.view.document)&&e.button===1)for(const t of e.composedPath()){const r=t;if(r.tagName&&r.tagName.toLowerCase()==="a"&&r.href){e.preventDefault();return}}},handleInnerKeydown=e=>{if(isUndoRedo(e)||isPrint(e))e.preventDefault();else if(isCopyPasteOrCut(e))if(onElectron)e.preventDefault();else return;hostMessaging.postMessage("did-keydown",{key:e.key,keyCode:e.keyCode,code:e.code,shiftKey:e.shiftKey,altKey:e.altKey,ctrlKey:e.ctrlKey,metaKey:e.metaKey,repeat:e.repeat})},handleInnerUp=e=>{hostMessaging.postMessage("did-keyup",{key:e.key,keyCode:e.keyCode,code:e.code,shiftKey:e.shiftKey,altKey:e.altKey,ctrlKey:e.ctrlKey,metaKey:e.metaKey,repeat:e.repeat})};function isCopyPasteOrCut(e){const t=e.ctrlKey||e.metaKey,r=e.shiftKey&&e.key.toLowerCase()==="insert";return t&&["c","v","x"].includes(e.key.toLowerCase())||r}function isUndoRedo(e){return(e.ctrlKey||e.metaKey)&&["z","y"].includes(e.key.toLowerCase())}function isPrint(e){return(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="p"}let isHandlingScroll=!1;const handleWheel=e=>{isHandlingScroll||hostMessaging.postMessage("did-scroll-wheel",{deltaMode:e.deltaMode,deltaX:e.deltaX,deltaY:e.deltaY,deltaZ:e.deltaZ,detail:e.detail,type:e.type})},handleInnerScroll=e=>{if(isHandlingScroll)return;const t=e.target,r=e.currentTarget;if(!t||!r||!t.body)return;const o=r.scrollY/t.body.clientHeight;isNaN(o)||(isHandlingScroll=!0,window.requestAnimationFrame(()=>{try{hostMessaging.postMessage("did-scroll",o)}catch(n){}isHandlingScroll=!1}))};function onDomReady(e){document.readyState==="interactive"||document.readyState==="complete"?e():document.addEventListener("DOMContentLoaded",e)}function areServiceWorkersEnabled(){try{return!!navigator.serviceWorker}catch(e){return!1}}function toContentHtml(e){const t=e.options,r=e.contents,o=new DOMParser().parseFromString(r,"text/html");if(o.querySelectorAll("a").forEach(i=>{if(!i.title){const u=i.getAttribute("href");typeof u=="string"&&(i.title=u)}}),o.body.hasAttribute("role")||o.body.setAttribute("role","document"),t.allowScripts){const i=o.createElement("script");i.id="_vscodeApiScript",i.textContent=getVsCodeApiScript(t.allowMultipleAPIAcquire,e.state),o.head.prepend(i)}o.head.prepend(defaultStyles.cloneNode(!0)),applyStyles(o,o.body);const n=o.querySelector('meta[http-equiv="Content-Security-Policy"]');if(!n)hostMessaging.postMessage("no-csp-found");else try{const i=n.getAttribute("content");if(i){const u=i.replace(/(vscode-webview-resource|vscode-resource):(?=(\s|;|$))/g,e.cspSource);n.setAttribute("content",u)}}catch(i){console.error(`Could not rewrite csp: ${i}`)}return`<!DOCTYPE html>
`+o.documentElement.outerHTML}onDomReady(()=>{if(!document.body)return;hostMessaging.onMessage("styles",(t,r)=>{++styleVersion,initData.styles=r.styles,initData.activeTheme=r.activeTheme,initData.themeName=r.themeName;const o=getActiveFrame();!o||o.contentDocument&&applyStyles(o.contentDocument,o.contentDocument.body)}),hostMessaging.onMessage("focus",()=>{const t=getActiveFrame();if(!t||!t.contentWindow){window.focus();return}document.activeElement!==t&&t.contentWindow.focus()});let e=0;hostMessaging.onMessage("content",async(t,r)=>{const o=++e;try{await workerReady}catch(s){console.error(`Webview fatal error: ${s}`),hostMessaging.postMessage("fatal-error",{message:s+""});return}if(o!==e)return;const n=r.options,i=toContentHtml(r),u=styleVersion,d=getActiveFrame(),w=firstLoad;let h;if(firstLoad)firstLoad=!1,h=(s,a)=>{typeof initData.initialScrollProgress=="number"&&!isNaN(initData.initialScrollProgress)&&a.scrollY===0&&a.scroll(0,s.clientHeight*initData.initialScrollProgress)};else{const s=d&&d.contentDocument&&d.contentDocument.body?assertIsDefined(d.contentWindow).scrollY:0;h=(a,c)=>{c.scrollY===0&&c.scroll(0,s)}}const m=getPendingFrame();m&&(m.setAttribute("id",""),document.body.removeChild(m)),w||(pendingMessages=[]);const l=document.createElement("iframe");l.setAttribute("id","pending-frame"),l.setAttribute("frameborder","0");const f=new Set(["allow-same-origin","allow-pointer-lock"]);n.allowScripts&&(f.add("allow-scripts"),f.add("allow-downloads")),n.allowForms&&f.add("allow-forms"),l.setAttribute("sandbox",Array.from(f).join(" ")),isFirefox||l.setAttribute("allow",n.allowScripts?"clipboard-read; clipboard-write;":""),l.src=`./fake.html?id=${ID}`,l.style.cssText="display: block; margin: 0; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: hidden",document.body.appendChild(l);function v(s){setTimeout(()=>{s.open(),s.write(i),s.close(),b(l),u!==styleVersion&&applyStyles(s,s.body)},0)}if(!n.allowScripts&&isSafari){const s=setInterval(()=>{if(!l.parentElement){clearInterval(s);return}const a=assertIsDefined(l.contentDocument);a.readyState!=="loading"&&(clearInterval(s),v(a))},10)}else assertIsDefined(l.contentWindow).addEventListener("DOMContentLoaded",s=>{const a=s.target?s.target:void 0;v(assertIsDefined(a))});const p=(s,a)=>{s&&s.body&&h(s.body,a);const c=getPendingFrame();if(c&&c.contentDocument&&c.contentDocument===s){const g=getActiveFrame();g&&document.body.removeChild(g),u!==styleVersion&&applyStyles(c.contentDocument,c.contentDocument.body),c.setAttribute("id","active-frame"),c.style.visibility="visible",a.addEventListener("scroll",handleInnerScroll),a.addEventListener("wheel",handleWheel),document.hasFocus()&&a.focus(),pendingMessages.forEach(y=>{a.postMessage(y.message,window.origin,y.transfer)}),pendingMessages=[]}hostMessaging.postMessage("did-load")};function b(s){clearTimeout(loadTimeout),loadTimeout=void 0,loadTimeout=setTimeout(()=>{clearTimeout(loadTimeout),loadTimeout=void 0,p(assertIsDefined(s.contentDocument),assertIsDefined(s.contentWindow))},200);const a=assertIsDefined(s.contentWindow);a.addEventListener("load",function(c){const g=c.target;loadTimeout&&(clearTimeout(loadTimeout),loadTimeout=void 0,p(g,this))}),a.addEventListener("click",handleInnerClick),a.addEventListener("auxclick",handleAuxClick),a.addEventListener("keydown",handleInnerKeydown),a.addEventListener("keyup",handleInnerUp),a.addEventListener("contextmenu",c=>{c.defaultPrevented||(c.preventDefault(),hostMessaging.postMessage("did-context-menu",{clientX:c.clientX,clientY:c.clientY}))}),unloadMonitor.onIframeLoaded(s)}hostMessaging.postMessage("did-set-content",void 0)}),hostMessaging.onMessage("message",(t,r)=>{if(!getPendingFrame()){const n=getActiveFrame();if(n){assertIsDefined(n.contentWindow).postMessage(r.message,window.origin,r.transfer);return}}pendingMessages.push(r)}),hostMessaging.onMessage("initial-scroll-position",(t,r)=>{initData.initialScrollProgress=r}),hostMessaging.onMessage("execCommand",(t,r)=>{const o=getActiveFrame();!o||assertIsDefined(o.contentDocument).execCommand(r)}),trackFocus({onFocus:()=>hostMessaging.postMessage("did-focus"),onBlur:()=>hostMessaging.postMessage("did-blur")}),window[vscodePostMessageFuncName]=(t,r)=>{switch(t){case"onmessage":case"do-update-state":hostMessaging.postMessage(t,r);break}},hostMessaging.postMessage("webview-ready",{})});

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/6cba118ac49a1b88332f312a8f67186f7f3c1643/core/vs/workbench/contrib/webview/browser/pre/main.js.map
