import { chromium } from '/Users/adebayovictor/Documents/dev/cofoundaz/cofoundaz/node_modules/@playwright/test/index.mjs'
import fs from 'fs'
const WS='57829571-0f6c-4298-8e87-5cbc70631b58'
const json=(d)=>({status:200,contentType:'application/json',body:JSON.stringify({data:d,meta:null})})
const me=(role)=>({user:{id:'u1',email:'placeholder@example.com'},profile:{full_name:'Placeholder Person',role_title:null,country:null,avatar_url:null},memberships:[{startup_id:WS,name:'NovaPay',role}],active_workspace_id:WS})
const OUT=process.argv[2]; const BASE='http://localhost:3105'
const vps=[[1440,900],[1440,700],[1366,768],[1280,720],[1280,600],[1024,640],[375,812],[375,520]]
const roles=[['founder','/dashboard'],['founder','/documents'],['accountant','/documents']]
const browser=await chromium.launch({channel:'chrome'})
const res=[]
for(const [role,path] of roles) for(const [w,h] of vps){
  const ctx=await browser.newContext({viewport:{width:w,height:h}}); const page=await ctx.newPage()
  await page.addInitScript((ws)=>{localStorage.setItem('cf_session','1');localStorage.setItem('cf_workspace_id',ws)},WS)
  await page.route('**/api/v1/**',r=>r.fulfill(json([])))
  await page.route('**/api/v1/auth/refresh',r=>r.fulfill(json({access_token:'x',refresh_token:null,expires_in:900})))
  await page.route('**/api/v1/auth/me',r=>r.fulfill(json(me(role))))
  await page.goto(BASE+path,{waitUntil:'domcontentloaded'})
  const mobile=w<1024
  if(mobile){ await page.getByLabel('Open sidebar').first().click().catch(async()=>{ await page.locator('button[aria-label*="enu"]').first().click() }) }
  await page.waitForSelector('[data-testid=sidebar-nav-scroll] a[aria-current=page]',{timeout:20000}).catch(()=>{})
  await page.waitForTimeout(700)
  const tag=`${role}-${path.slice(1)}-${w}x${h}`
  const info=await page.evaluate(()=>{
    const aside=document.querySelector('aside[aria-label="Main navigation"]'); const ar=aside.getBoundingClientRect()
    const scrollers=[...aside.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return /(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+1}).map(e=>`${e.dataset.testid||e.className.slice(0,20)} ${e.scrollHeight}/${e.clientHeight}`)
    const nav=document.querySelector('[data-testid=sidebar-nav-scroll]')
    const items=[...nav.querySelectorAll('ul a')]; const footer=[...nav.querySelectorAll('a[href="/notifications"],a[href="/settings"],a[href="/setup/mfa"]')]
    const top=nav.getBoundingClientRect()
    const footTop=footer[0].getBoundingClientRect().top
    const visItems=items.filter(a=>{const r=a.getBoundingClientRect();return r.top>=top.top-1&&r.bottom<=footTop&&r.bottom<=innerHeight}).length
    const act=nav.querySelector('a[aria-current=page]'); const ar2=act?.getBoundingClientRect()
    return {items:items.length,visItems,scrollers,activeInView:!!ar2&&ar2.top>=top.top-1&&ar2.bottom<=Math.min(top.bottom,innerHeight)+1,asideH:ar.height,docOverflowX:document.documentElement.scrollWidth>innerWidth}
  })
  await page.screenshot({path:`${OUT}/${tag}-top.png`})
  // scroll everything to the end
  await page.evaluate(()=>{const n=document.querySelector('[data-testid=sidebar-nav-scroll]');n.scrollTop=n.scrollHeight})
  const end=await page.evaluate(()=>{
    const aside=document.querySelector('aside[aria-label="Main navigation"]').getBoundingClientRect()
    const inView=(el)=>{const r=el.getBoundingClientRect();return r.top>=aside.top-1&&r.bottom<=Math.min(aside.bottom,innerHeight)+1&&r.height>0}
    const f=['/notifications','/settings','/setup/mfa'].map(h=>document.querySelector(`[data-testid=sidebar-nav-scroll] a[href="${h}"]`)).filter(Boolean)
    const prof=document.querySelector('button[aria-haspopup=menu][aria-expanded]:not(:first-of-type)')
    const profs=[...document.querySelectorAll('aside button[aria-haspopup=menu]')]; const pb=profs[profs.length-1]
    // overlaps among footer items
    const rs=[...f,pb].map(e=>e.getBoundingClientRect()); let overlap=false
    for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){if(rs[i].top<rs[j].bottom-1&&rs[j].top<rs[i].bottom-1)overlap=true}
    return {footerInView:f.every(inView),profileInView:inView(pb),overlap}
  })
  await page.screenshot({path:`${OUT}/${tag}-end.png`})
  const pbtn=page.locator('aside button[aria-haspopup=menu]').last(); await pbtn.click()
  await page.waitForTimeout(200)
  const so=await page.getByRole('menuitem',{name:'Sign out'}); const sb=await so.boundingBox()
  const signOutInView=!!sb&&sb.y>=0&&sb.y+sb.height<=h
  await page.screenshot({path:`${OUT}/${tag}-profile.png`})
  const r={tag,...info,...end,signOutInView}
  res.push(r); console.log(JSON.stringify(r))
  await ctx.close()
}
await browser.close()
fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1))
