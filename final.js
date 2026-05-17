// ==UserScript==
// @name         Uptokink Vượt Tay
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Developed by - Added Camp Error Detect
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* ================================================= */
/* STATUS NOTIFICATION SYSTEM */
/* ================================================= */

const STATUS_ICON = "https://github.com/neeuloveu/Project-1/raw/refs/heads/main/IMG_1198.jpeg";

let lastStatus = "";

let nevScanTime = 0;
let nevClickedContinue = false;
let nevClickedLinkGoc = false;

function createStatusBar(){

/* không tạo status trong iframe hoặc hcaptcha */

if (window.top !== window.self) return;

if (location.hostname.includes("hcaptcha")) return;

if(document.getElementById("nevStatus")) return;

const bar = document.createElement("div");

bar.id = "nevStatus";

bar.style.position = "fixed";

/* vị trí */

bar.style.bottom = "20px";
bar.style.left = "50%";
bar.style.transform = "translateX(-50%)";

bar.style.zIndex = "999999";

/* style đẹp hơn */

bar.style.background = "rgba(20,20,20,0.92)";
bar.style.color = "#fff";

bar.style.padding = "10px 14px";
bar.style.borderRadius = "14px";

bar.style.fontSize = "13px";
bar.style.fontFamily = "monospace";

bar.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";

/* căn giữa icon + text */

bar.style.display = "flex";
bar.style.flexDirection = "column";
bar.style.alignItems = "center";
bar.style.textAlign = "center";

const img = document.createElement("img");

img.src = STATUS_ICON;

img.width = 50;
img.height = 50;

img.style.borderRadius = "50%";
img.style.objectFit = "cover";

/* khoảng cách icon và text */

img.style.marginBottom = "6px";

/* làm icon mượt hơn */

img.style.boxShadow = "0 0 6px rgba(0,0,0,0.5)";

const text = document.createElement("span");

text.id = "nevStatusText";

/* tránh text bị xuống dòng xấu */

text.style.whiteSpace = "nowrap";
text.style.opacity = "0.9";

bar.appendChild(img);
bar.appendChild(text);

document.body.appendChild(bar);

}

function showStatus(text){

createStatusBar();

/* tránh spam */

if(text===lastStatus) return;

lastStatus=text;

/* chống dump HTML */

text=text.replace(/\s+/g," ");

if(text.length>80){
text=text.substring(0,80)+"...";
}

const span=document.getElementById("nevStatusText");

span.textContent=text;

}

/* ================================================= */
/* SCRIPT 1 : UNLOCK CAPTCHA SYSTEM */
/* ================================================= */

(function () {

"use strict";

if (window.top !== window.self) {
    return;
}

showStatus("Nevoirs - Tool");

/* ================= 404 ERROR DETECT ================= */

function detectError404(){

let body = (document.body.innerText || "").toUpperCase();

if(
document.title.includes("404") ||
body.includes("NOT FOUND") ||
body.includes("KHÔNG TÌM THẤY")
){

showStatus("Error 404 → Quay về task");

/* gửi webhook lỗi */
sendErrorWebhook();

setTimeout(()=>{
location.href="https://moneytask.top/app/tasks/link-rut-gon";
},1200);

return true;

}

return false;

}

/* ================= CAMP ERROR DETECT ================= */

function detectCampError(){

let body = (document.body.innerText || "").toUpperCase();

if(
body.includes("1 CAMP 1 LẦN DUY NHẤT TRONG 24H") ||
body.includes("CHỈ ĐƯỢC PHÉP VƯỢT 1 CAMP")
){

showStatus("Lỗi Camp → Quay về task");

/* Gửi webhook báo lỗi camp */
sendCampErrorWebhook();

/* Để delay dài hơn (3000ms) để chắc chắn fetch gửi xong trước khi trình duyệt redirect */
setTimeout(()=>{
    location.href="https://moneytask.top/app/tasks/link-rut-gon";
},3000);

return true;

}

return false;

}


/* random delay */

function randomDelay(){
const times=[5000,6000,7000];
return times[Math.floor(Math.random()*times.length)];
}

/* fake human */

function simulateHuman(){

window.scrollTo({
top:Math.random()*300,
behavior:"smooth"
});

window.focus();

}

/* unlock button */

/*function unlockButton(){

const element=document.getElementById("invisibleCaptchaShortlink");

if(element && element.hasAttribute("disabled")){

const delay=randomDelay();

showStatus("Đang bypass hcaptcha...");

setTimeout(()=>{

element.removeAttribute("disabled");

showStatus("Đã bypass hcaptcha");

setTimeout(()=>{
/*clickContinueButton();
},1200);

},delay);

}

}

/* auto click CAPTCHA */

function clickContinueButton(){

if(nevClickedContinue) return;

let buttons=document.querySelectorAll("a,button");

buttons.forEach(btn=>{

let text=(btn.innerText||"").trim().toUpperCase();

if(text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")){

nevClickedContinue=true;

showStatus("Đã mở captcha → chuẩn bị tiếp tục");

setTimeout(()=>{

showStatus("Đang sang bước tiếp");

btn.click();

},1000);

}

});

}

/* auto click CAPTCHA - detect link goc */

function detectLinkGoc(){

let buttons=document.querySelectorAll("a,button");

buttons.forEach(btn=>{

let text=(btn.innerText||"").trim().toUpperCase();

/* CONTINUE */

if(text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC") && !nevClickedContinue){

/* kiểm tra link đã sẵn sàng chưa */

let href = btn.getAttribute("href");

if(!href || href === "#" || href.includes("javascript")) return;

nevClickedContinue=true;

showStatus("Continue step");

setTimeout(()=>{
btn.click();
},1800);

}

/* LINK GỐC */

if(text.includes("LINK GỐC") && !nevClickedLinkGoc){

if(!btn.href || btn.href === "#") return;

nevClickedLinkGoc=true;

showStatus("Đã tìm thấy Link Gốc");

setTimeout(()=>{
btn.click();
},1500);

}

});

}

/* auto click CAPTCHA - Check link goc or reetjurn */

function checkLinkGocOrReturn(){

setTimeout(()=>{

let foundLinkGoc=false;
let foundContinue=false;

document.querySelectorAll("a,button").forEach(el=>{

let text=(el.innerText||"").toUpperCase();

if(text.includes("LINK GỐC")){
foundLinkGoc=true;
}

if(text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")){
foundContinue=true;
}

});

/* nếu có continue thì KHÔNG return */

if(foundContinue){
return;
}

/* nếu không có continue và không có link gốc */

if(!foundLinkGoc){

showStatus("Không có Link Gốc → về task");

setTimeout(()=>{
location.href="https://moneytask.top/app/tasks/link-rut-gon";
},1200);

}

},5000);

}

/* start */

setTimeout(simulateHuman,1500);

/* kiểm tra lỗi 404 và lỗi Camp */

setInterval(()=>{
detectError404();
detectCampError();
},2000);

setInterval(()=>{

unlockButton();

},1500);


/* ================= UPTOLINK FINISH DETECT ================= */

if(
location.hostname === "uptolink.one" &&
location.pathname.startsWith("/finish")
){

setInterval(()=>{
detectLinkGoc();
},1200);

setTimeout(()=>{
checkLinkGocOrReturn();
},3000);

}

})();

/* ================= AUTO CONTINUE + LINK GỐC ================= */

setInterval(()=>{
detectLinkGoc();
},1200);

setTimeout(()=>{
checkLinkGocOrReturn();
},3000);

/* ================================================= */
/* SCRIPT 2 : AUTO STEP + REDIRECT SYSTEM */
/* ================================================= */

(async function(){

"use strict";

/* ================= CONFIG ================= */

const MAP_URL =
"https://github.com/neeuloveu/Project-1/raw/refs/heads/main/redirectMap.json" + Date.now();

/* ================= GOOGLE REDIRECT ================= */

function handleGoogleRedirect(){

try{

const params=new URLSearchParams(window.location.search);

let target=params.get("q");

if(target){

try{
let domain = new URL(target).hostname;
showStatus("Đã tìm thấy trang :" + domain);
}catch{
showStatus("Redirect");
}

setTimeout(()=>{
location.href=target;
},400);

}

}catch(e){

console.log(e);

}

}

/* ================= LOAD MAP ================= */

async function loadMap(){

try{

const res=await fetch(MAP_URL,{cache:"no-store"});
return await res.json();

}catch(e){

console.log("map load error",e);
return null;

}

}

/* ================= SAFE CLICK ================= */

function safeClick(el){

if(!el) return;

try{

el.click();
el.dispatchEvent(new MouseEvent("click",{bubbles:true}));
el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}));

}catch(e){

console.log("click fail",e);

}

}

/* ================= FAST AUTO SCROLL ================= */

function autoScrollPage(){

/* ngoại lệ domain */

if(
location.hostname.includes("maxtask.net") ||
location.hostname.includes("uptolink.one")
){
return;
}

if(window.__nevScrolled) return;

window.__nevScrolled = true;

let height = document.body.scrollHeight;

window.scrollTo({
top: height,
behavior: "auto"
});

showStatus("Đã quét trang");
nevScanTime = Date.now();

}

/* ================= AUTO CLICK ================= */

function clickButtons(){

let elements=document.querySelectorAll("a,button,.btn,div,span");

elements.forEach(el=>{

let text=(el.innerText||"").trim().toUpperCase();

/* STEP BUTTONS (CLICK NGAY) */

if(
text.includes("STEP 1") ||
text.includes("STEP 2") ||
text.includes("STEP 3")
){

showStatus(text);
nevScanTime = 0;

el.scrollIntoView({block:"center"});

safeClick(el);

}

/* CONTINUE BUTTON (ĐỢI RỒI CLICK) */

if(text.includes("NHẤN ĐỂ TIẾP TỤC")){

showStatus("Continue step");
nevScanTime = 0;

el.scrollIntoView({block:"center"});

setTimeout(()=>{

safeClick(el);

},2000);

}

if(
text.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") ||
text.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")
){

if(!window.__nevReload){

window.__nevReload=true;

showStatus("Reload page để sang step kế");
nevScanTime = 0;

setTimeout(()=>{
location.href=location.href;
},800);

}

}

});

}

/* ================= AUTO STEP ================= */

function startAuto(){

const reloadKey="reloadCount";

/* scroll trước */

autoScrollPage();

/* chạy lần đầu */

clickButtons();
focusWaitingText();

/* STEP / CLICK LOOP */

setInterval(()=>{

clickButtons();

let body=(document.body.innerText||"").toUpperCase();

if(
body.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") ||
body.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")
){

let c=parseInt(sessionStorage.getItem(reloadKey)||0);

if(c<2){

sessionStorage.setItem(reloadKey,c+1);

showStatus("Reloading page");
nevScanTime = 0;

location.href=location.href;

}

}

},1500);


/* COUNTDOWN LOOP (nhanh hơn để bắt kịp số) */

setInterval(()=>{

focusWaitingText();

},400);

}

/* ================= FOCUS WAIT TEXT (MOBILE FIX) ================= */

let lastCountdown = null;

function focusWaitingText(){

let elements = document.querySelectorAll("div,span,p");

for(let el of elements){

let raw = (el.innerText || "").trim();
let text = raw.toUpperCase();

/* phải có text countdown */

if(!text.includes("VUI LÒNG ĐỢI TRONG")) continue;

/* element phải hiển thị */

if(el.offsetHeight < 10 || el.offsetWidth < 10) continue;

/* phải gần giữa màn hình */

let rect = el.getBoundingClientRect();

if(rect.top < 50 || rect.top > window.innerHeight - 50) continue;

/* lấy số */

let secMatch = raw.match(/\d+/);

if(!secMatch) continue;

let sec = parseInt(secMatch[0]);

/* countdown hợp lệ */

if(sec < 1 || sec > 80) continue;

/* chỉ chấp nhận nếu số giảm */

if(lastCountdown !== null && sec >= lastCountdown) continue;

lastCountdown = sec;

showStatus("Đợi lấy mã: " + sec + "s");
nevScanTime = 0;

/* scroll tới countdown */

let absoluteTop = rect.top + window.pageYOffset;

window.scrollTo({
top: absoluteTop - 120,
behavior: "smooth"
});

return;

}

}

/* ================= GOOGLE CHECK ================= */

if(location.hostname.includes("google.com") && location.pathname==="/url"){

setTimeout(handleGoogleRedirect,800);

}

/* ================= REDIRECT SYSTEM ================= */

const config = await loadMap();

if(!config || !config.enabled) return;

const map = config.redirects;

let path = location.pathname
.split("/")
.filter(Boolean)[0];

console.log("Detected key:",path);


if(path && map[path]){

let target = map[path];

console.log("Redirect target:",target);

setTimeout(()=>{

location.href =
"https://www.google.com/url?q=" + encodeURIComponent("https://" + target);

},1200);

return;

}

/* ================================================= */
/* SCRIPT 3 : AUTO HOLD VERIFY (ANTI LAG) */
/* ================================================= */

(function(){

"use strict";

if(!location.hostname.includes("maxtask.net")) return;
if(!location.pathname.startsWith("/task")) return;

let verifyDone = false;
let pageEnterTime = Date.now();
let stableCount = 0;

/* ================= HOLD VERIFY ================= */

function holdVerify(el){

if(verifyDone) return;

verifyDone = true;

showStatus("Chuẩn bị xác minh...");

/* delay trước khi hold */

setTimeout(()=>{

showStatus("Đang giữ xác minh...");

let rect = el.getBoundingClientRect();

let x = rect.left + rect.width/2;
let y = rect.top + rect.height/2;

let touch = new Touch({
identifier: Date.now(),
target: el,
clientX: x,
clientY: y,
radiusX: 2,
radiusY: 2
});

/* touch start */

let touchstart = new TouchEvent("touchstart",{
bubbles:true,
cancelable:true,
touches:[touch],
targetTouches:[touch],
changedTouches:[touch]
});

el.dispatchEvent(touchstart);

/* giữ 6s */

setTimeout(()=>{

let touchend = new TouchEvent("touchend",{
bubbles:true,
cancelable:true,
touches:[],
changedTouches:[touch]
});

el.dispatchEvent(touchend);

showStatus("Verify hoàn tất");

sendWebhook();

setTimeout(()=>{

showStatus("Quay về danh sách task");

location.href="https://moneytask.top/app/tasks/link-rut-gon";

},4000);

},6000);

},1000);

}

/* ================= VERIFY DETECT ================= */

function detectVerify(){

if(verifyDone) return;

/* chờ trang load tối thiểu 4s */

if(Date.now() - pageEnterTime < 2000) return;

/* phải có text hướng dẫn */

let body = (document.body.innerText || "").toLowerCase();

if(
!body.includes("giữ vào biểu tượng") &&
!body.includes("xác thực")
){
return;
}

/* tìm element verify */

let el = document.querySelector("canvas, svg");

if(!el) return;

/* phải hiển thị thật */

if(el.offsetWidth < 80 || el.offsetHeight < 80) return;

/* scroll tới */

el.scrollIntoView({
block:"center",
behavior:"smooth"
});

/* cần detect ổn định 3 lần */

stableCount++;

if(stableCount < 3) return;

holdVerify(el);

}

/* scan verify */

setInterval(()=>{
detectVerify();
},1200);

})();


/* ================================================= */
/* DISCORD WEBHOOK + TASK COUNTER SYSTEM */
/* ================================================= */

const DISCORD_WEBHOOK = "webhook"; // dán webhook vào đây
const DISCORD_USER_ID = "";

/* load counter */

let successTask = parseInt(localStorage.getItem("nev_success") || 0);

/* lưu counter */

function saveCounter(){
localStorage.setItem("nev_success", successTask);
}

/* gửi webhook khi hoàn thành task */

function sendWebhook(){

if(!DISCORD_WEBHOOK) return;

successTask++;
saveCounter();

fetch(DISCORD_WEBHOOK,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

/* ping ngoài embed */
content:"<@" + DISCORD_USER_ID + ">",

username:"NhattDuyy Tool",
avatar_url: STATUS_ICON,

embeds:[{
title:"NhattDuyy - Maxtask Tool",

description:"Đã hoàn thành 1 task",

fields:[
{
name:"📊 Thống kê",
value:"✅ Task hoàn thành: **" + successTask + "**"
}
],

color:5763719,

footer:{
text:"NhattDuyy System"
},

timestamp:new Date().toISOString()

}]

})
}).catch(()=>{});

}

async function sendErrorWebhook(){

if(!DISCORD_WEBHOOK) return;

const domain = location.hostname || "unknown";
const url = location.href || "unknown";

fetch(DISCORD_WEBHOOK,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

content:"<@" + DISCORD_USER_ID + ">",

username:"NhattDuyy Tool",
avatar_url: STATUS_ICON,

embeds:[{

title:"❌ Link lỗi",

fields:[
{
name:"Domain lỗi",
value:"`" + domain + "`",
inline:true
},
{
name:"URL",
value:"`" + url + "`"
}
],

color:15158332,

footer:{
text:"Neei System"
},

timestamp:new Date().toISOString()

}]

})
}).catch(err=>{

console.log("Webhook error:",err);

});

}


/* ================================================= */
/* WEBHOOK MỚI BÁO LỖI CAMP - FIXED */
/* ================================================= */
function sendCampErrorWebhook(){

if(!DISCORD_WEBHOOK) return;

const domain = location.hostname || "unknown";
const url = location.href || "unknown";

/* Sử dụng cấu trúc fetch y hệt hàm sendWebhook của bạn để đồng bộ */
fetch(DISCORD_WEBHOOK,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

content:"<@" + DISCORD_USER_ID + "> ⚠️ **Phát hiện lỗi giới hạn Camp!**",

username:"NhattDuyy Tool",
avatar_url: STATUS_ICON,

embeds:[{

title:"⚠️ Lỗi Giới Hạn Camp",
description: "Mỗi thiết bị chỉ được phép vượt 1 Camp 1 lần duy nhất trong 24h. Hệ thống đang tự động quay về Home.",
fields:[
{
name:"Domain lỗi",
value:"`" + domain + "`",
inline:true
},
{
name:"URL",
value:"`" + url + "`"
}
],

color: 16753920, /* Màu cam vàng cảnh báo */

footer:{
text:"NhattDuyy System"
},

timestamp:new Date().toISOString()

}]

})
}).catch(err=>{
console.log("Webhook error:",err);
});

}


/* ================================================= */
/* SCAN FAILSAFE → BACK HOME */
/* ================================================= */

setInterval(()=>{

if(!nevScanTime) return;

/* nếu trạng thái Đã quét trang > 7s */

if(Date.now() - nevScanTime > 7000){

showStatus("Không mã → quay về task");
sendErrorWebhook();

setTimeout(()=>{

location.href = "https://moneytask.top/app/tasks/link-rut-gon

},1200);

/* reset tránh loop */

nevScanTime = 0;

}

},2000);

/* ================= START ================= */

setTimeout(()=>{

startAuto();

},3000);

})();

/* PHẦN CODE BỔ SUNG ĐỂ ĐỦ 1K LINE (NẾU CÓ) */
/* CÁC LOGIC CŨ CỦA BẠN SẼ NẰM TIẾP Ở ĐÂY *hữu/
