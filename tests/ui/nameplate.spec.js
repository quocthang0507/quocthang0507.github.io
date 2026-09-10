const { test } = require('@playwright/test');
const fs = require('fs');
test('nameplate artwork, exports and responsive layout', async ({ page }) => {
 await page.setViewportSize({width:1280,height:900});
 fs.mkdirSync('.tmp', {recursive:true});
 let html = fs.readFileSync('delegate-nameplate.html','utf8').replace(/^---[\s\S]*?---/,'').replace(/<link[^>]+>/,'');
 await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
 await page.addStyleTag({path:'assets/css/delegate-nameplate.css'});
 await page.addScriptTag({path:'assets/js/nameplate-zip.js'});
 await page.addScriptTag({path:'assets/js/delegate-nameplate.js'});
 await page.evaluate(()=>document.dispatchEvent(new Event('DOMContentLoaded')));
 const assert=(v,m)=>{if(!v) throw Error(m);};
 assert(await page.locator('#np-preview svg').getAttribute('width')==='20cm','initial width');
 for(const size of ['15x7','20x6','20x8','24x10','24x12','25x10','28x10','30x12']){
  await page.selectOption('#np-size',size);
  assert(await page.locator('#np-preview svg').getAttribute('width')===size.split('x')[0]+'cm','size '+size);
 }
 await page.selectOption('#np-size','20x8');
 for(const layout of ['one','two','logo','band','duplex']){
  await page.selectOption('#np-layout',layout);
  assert(await page.locator('#np-preview text').count()===(layout==='one'?1:2),'layout '+layout);
 }
 assert(await page.locator('#np-back-preview').textContent()==='ĐẠI BIỂUSỐ 01 · XIN VUI LÒNG NGỒI ĐÚNG VỊ TRÍ','back content');
 await page.fill('#np-name','<script>alert(1)</script> NGUYỄN THỊ MINH PHƯƠNG '.repeat(3));
 assert(await page.locator('#np-preview script').count()===0,'text injection');
 const fits = await page.locator('#np-preview text').evaluateAll(nodes=>nodes.every(n=>{const b=n.getBBox();return b.x>=0 && b.x+b.width<=2000 && b.y>=0 && b.y+b.height<=800;}));
 assert(fits,'long text bounds');
 await page.fill('#np-name','NGUYỄN VĂN AN');
 for(const theme of ['red','gold','blue','split','white']) await page.selectOption('#np-theme',theme);
 for(const border of ['none','single','rounded','double','ornament','modern','horizontal']) await page.selectOption('#np-border',border);
 await page.selectOption('#np-border','double');
 await page.setInputFiles('#np-logo',{name:'logo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});
 await page.waitForFunction(()=>document.querySelector('#np-preview image'));
 for (const format of ['svg','png','jpg']) {
  await page.selectOption('#np-format',format);
  const [d] = await Promise.all([page.waitForEvent('download'),page.click('#np-download')]);
  await d.saveAs('.tmp/nameplate.'+format);
  if(format!=='svg'){
   const dims=await page.evaluate(async({data,type})=>{const img=new Image();img.src='data:'+type+';base64,'+data;await img.decode();return [img.width,img.height];},{data:fs.readFileSync('.tmp/nameplate.'+format).toString('base64'),type:format==='png'?'image/png':'image/jpeg'});
   assert(dims[0]===2362 && dims[1]===945,'export dimensions '+format);
  }
 }
 await page.selectOption('#np-size','custom');await page.fill('#np-width','5');await page.fill('#np-margin-x','40');
 assert(await page.locator('#np-download').isDisabled(),'invalid margins blocked');
 await page.fill('#np-width','60');await page.fill('#np-height','40');await page.fill('#np-margin-x','8');await page.selectOption('#np-dpi','600');
 assert(await page.locator('#np-download').isDisabled(),'oversized raster blocked');
 await page.selectOption('#np-size','20x8');await page.selectOption('#np-format','svg');
 await page.evaluate(()=>{window.print=()=>{};});await page.click('#np-print');
 assert(await page.locator('body > #np-print-area svg').count()===2,'print both faces');
 await page.emulateMedia({media:'print'});
 assert(await page.locator('#np-print-area').isVisible(),'print visible');
 await page.emulateMedia({media:'screen'});
 await page.screenshot({path:'.tmp/nameplate-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile overflow');
 await page.screenshot({path:'.tmp/nameplate-mobile.png',fullPage:true});
 
});


async function openLocalized(page, language = 'vi') {
 await page.addInitScript(lang => localStorage.setItem('preferredLanguage', lang), language);
 await page.route('http://nameplate.test/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path === '/') {
   const body = fs.readFileSync('delegate-nameplate.html','utf8').replace(/^---[\s\S]*?---/,'').replace(/\{\{[^}]+\}\}/g,'/assets/css/delegate-nameplate.css');
   await route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"></head><body>'+body+'<script src="/assets/js/i18n.js"></script><script src="/assets/js/nameplate-zip.js"></script><script src="/assets/js/delegate-nameplate.js"></script></body></html>'});
  } else if (/^\/assets\/(js|css)\/[\w/.-]+$/.test(path) && fs.existsSync('.'+path)) await route.fulfill({path:'.'+path});
  else await route.fulfill({status:404,body:''});
 });
 await page.goto('http://nameplate.test/');
 await page.waitForFunction(()=>window.translationSystem?.translations.ja?.['np.title']);
}

test('all five languages initialize and switch without changing delegate data', async ({ page }) => {
 const {expect}=require('@playwright/test');
 await openLocalized(page,'en');
 await expect(page.locator('h1')).toHaveText('Delegate nameplate');
 await expect(page.locator('#np-dimensions')).toContainText('side');
 await page.fill('#np-name','Tên riêng không dịch');
 for(const [lang,title] of [['vi','Bảng tên đại biểu'],['zh','代表姓名牌'],['ko','참석자 명패'],['ja','出席者の名札'],['en','Delegate nameplate']]) {
  await page.evaluate(lang=>window.translationSystem.changeLanguage(lang),lang);
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('#np-name')).toHaveValue('Tên riêng không dịch');
  const translated=await page.evaluate(()=>Array.from(document.querySelectorAll('[data-i18n]')).every(n=>n.textContent===window.t(n.dataset.i18n)));
  expect(translated).toBe(true);
  expect(await page.locator('#np-layout-help').textContent()).not.toContain('help_');
 }
});

test('batch ZIP, per-delegate preview, print and invalid rows', async ({ page }) => {
 const {expect}=require('@playwright/test');
 await openLocalized(page);
 await page.selectOption('#np-mode','batch');
 await expect(page.locator('#np-download-batch')).toBeDisabled();
 await page.fill('#np-batch-input','AN\tGIÁM ĐỐC\tKHÁCH MỜI\t01\nBÌNH | TRƯỞNG PHÒNG | ĐẠI BIỂU | 02');
 await page.selectOption('#np-layout','duplex');
 await expect(page.locator('#np-batch-select option')).toHaveCount(2);
 await page.selectOption('#np-batch-select','1');
 await expect(page.locator('#np-preview text').first()).toHaveText('BÌNH');
 await expect(page.locator('#np-back-preview text').last()).toHaveText('02');
 for(const format of ['svg','png','jpg']) {
  await page.selectOption('#np-format',format);
  if(format !== 'svg') await page.selectOption('#np-dpi','150');
  const [d]=await Promise.all([page.waitForEvent('download'),page.click('#np-download-batch')]);
  const path='.tmp/batch-'+format+'.zip'; await d.saveAs(path);
  const bytes=fs.readFileSync(path);let offset=0;const files=[];
  while(bytes.readUInt32LE(offset)===0x04034b50){
   const len=bytes.readUInt32LE(offset+18),n=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28);
   const name=bytes.subarray(offset+30,offset+30+n).toString();
   const data=bytes.subarray(offset+30+n+extra,offset+30+n+extra+len);
   files.push({name,data});offset+=30+n+extra+len;
  }
  expect(files.map(f=>f.name)).toEqual(['001-front','001-back','002-front','002-back'].map(n=>n+'.'+format));
  if(format==='svg'){
   expect(files[0].data.toString()).toContain('GIÁM ĐỐC');expect(files[2].data.toString()).toContain('BÌNH');
  }else{
   for(const f of files){
    const dims=await page.evaluate(async({base64,mime})=>{const img=new Image();img.src='data:'+mime+';base64,'+base64;await img.decode();return [img.width,img.height]}, {base64:f.data.toString('base64'),mime:format==='png'?'image/png':'image/jpeg'});
    expect(dims).toEqual([1181,472]);
   }
  }
 }
 await page.evaluate(()=>{window.print=()=>{}});await page.click('#np-print-batch');
 await expect(page.locator('#np-print-area svg')).toHaveCount(4);
 await page.fill('#np-batch-input','AN | CHỨC VỤ\n| THIẾU TÊN');
 await expect(page.locator('#np-download-batch')).toBeDisabled();
 await expect(page.locator('#np-batch-status')).toContainText('Dòng 2');
 await page.fill('#np-batch-input',Array(201).fill('AN').join('\n'));
 await expect(page.locator('#np-print-batch')).toBeDisabled();
 await page.fill('#np-batch-input','<script>alert(1)</script> | CHỨC VỤ');
 await expect(page.locator('#np-preview script')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('smart font size grows and shrinks without crossing configured margins', async ({ page }) => {
 const {expect}=require('@playwright/test');
 await openLocalized(page);
 await page.selectOption('#np-layout','two');
 await page.fill('#np-margin-x','20');await page.fill('#np-margin-y','12');
 await page.check('#np-italic');
 const size=()=>page.locator('#np-preview text').first().getAttribute('font-size').then(Number);
 await page.fill('#np-name','AN');const short=await size();
 await page.fill('#np-name','NGUYỄN THỊ MINH PHƯƠNG');const long=await size();expect(long).toBeLessThan(short);
 await page.fill('#np-margin-x','35');expect(await size()).toBeLessThan(long);
 const values=['NGUYỄN THỊ MINH PHƯƠNG','TRƯỞNG PHÒNG QUẢN LÝ CHẤT LƯỢNG VÀ HỢP TÁC QUỐC TẾ','中华人民共和国代表姓名','国際協力推進本部長','국제협력부 부서장'];
 for(const text of values)for(const align of ['start','middle','end']){
  await page.selectOption('#np-align',align);await page.fill('#np-name',text);await page.fill('#np-role',text);
  const bounds=await page.locator('#np-preview text').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBBox();return [b.x,b.y,b.x+b.width,b.y+b.height]}));
  for(const [x,y,right,bottom] of bounds){expect(x).toBeGreaterThanOrEqual(350);expect(right).toBeLessThanOrEqual(1650);expect(y).toBeGreaterThanOrEqual(120);expect(bottom).toBeLessThanOrEqual(680);}
  await expect(page.locator('#np-preview text')).toHaveCount(2);await expect(page.locator('#np-preview tspan')).toHaveCount(0);
 }
 await page.selectOption('#np-fit','shrink');await page.fill('#np-name-size','12');
 expect(await size()).toBeLessThanOrEqual(12*3.52778);
 await page.selectOption('#np-fit','smart');await expect(page.locator('#np-name-size')).toBeDisabled();
 await page.screenshot({path:'.tmp/nameplate-smart.png',fullPage:true});
});

