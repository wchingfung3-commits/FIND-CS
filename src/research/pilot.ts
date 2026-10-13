export type ResearchChannel = 'phone' | 'whatsapp' | 'live_chat';
export type ResearchRoute = { id: string; issue: string; channel: ResearchChannel; contact: string; sourceIds: string[]; hours?: string; note: string; officialSteps?: string[]; actionUrl?: string; conflict?: true };
export type ResearchCompany = { id: string; name: string; scope: string; menuComplete: false; remaining: string; sources: { id: string; url: string; label: string }[]; routes: ResearchRoute[] };
export const sourceCheckedOn = '2026-10-14';
// Public-source research only. No call, message, human-reaching observation or speed measurement.
export const pilotCompanies: ResearchCompany[] = [
  { id: 'csl', name: 'CSL', scope: '香港 csl 客戶服務；不混入其他 HKT 品牌', menuComplete: false,
    remaining: '未取得完整電話／WhatsApp 選單；帳單、漫遊、網絡等問題的按鍵分支待實測。',
    sources: [{ id: 'csl-contact', url: 'https://www.hkcsl.com/zh_HK/contact-us', label: 'csl 官方聯絡頁' }],
    routes: [
      { id: 'csl-general-phone', issue: '其他問題／不確定分類', channel: 'phone', contact: '+852 2512 3123', actionUrl: 'tel:+85225123123', hours: '官方熱線：24 小時；真人接聽待測', sourceIds: ['csl-contact'], note: '一般客服入口。按鍵、轉真人與等候時間未實測。' },
      { id: 'csl-general-wa', issue: '其他問題／不確定分類', channel: 'whatsapp', contact: '+852 6653 2123', actionUrl: 'https://wa.me/85266532123', sourceIds: ['csl-contact'], note: '官方「WhatsApp 客戶服務專員」連結。未傳訊息；真人轉接步驟及時間待測。' },
      { id: 'csl-sales-phone', issue: '產品／銷售查詢', channel: 'phone', contact: '+852 2888 2123', actionUrl: 'tel:+85228882123', sourceIds: ['csl-contact'], note: '銷售入口，不代表可處理現有帳戶問題；選單待測。' },
      { id: 'csl-sales-wa', issue: '產品／銷售查詢', channel: 'whatsapp', contact: '+852 5212 3123', actionUrl: 'https://wa.me/85252123123', sourceIds: ['csl-contact'], note: '官方銷售 WhatsApp，與一般客服號碼不同；未實測。' },
    ] },
  { id: 'hangseng', name: '恆生銀行', scope: '香港個人理財；不同卡種／理財級別可能有不同專線', menuComplete: false,
    remaining: '官方服務類別不是完整 IVR 選單。逐項按鍵、卡種專線及轉真人仍待測；不使用真實戶口資料。',
    sources: [
      { id: 'hs-contact', url: 'https://www.hangseng.com/zh-hk/contact/', label: '官方聯絡及專線分類' },
      { id: 'hs-chat', url: 'https://www.hangseng.com/zh-hk/personal/digital/live-chat/', label: '官方在線通訊說明' },
      { id: 'hs-fraud', url: 'https://www.hangseng.com/zh-hk/resources/security/fraud-reporting/', label: '官方詐騙舉報指引' },
    ], routes: [
      { id: 'hs-general', issue: '其他問題／不確定分類', channel: 'phone', contact: '+852 2822 0228', actionUrl: 'tel:+85228220228', sourceIds: ['hs-contact'], note: '官方一般查詢熱線；轉真人按鍵待實測。' },
      { id: 'hs-wa', issue: '其他問題／不確定分類', channel: 'whatsapp', contact: '+852 2822 0303', actionUrl: 'https://wa.me/85228220303', sourceIds: ['hs-contact','hs-chat'], note: '先進入 HARO 機械人，官方表示可使用在線通訊聯絡客服員；具體選單待測。此號碼不能當電話熱線。' },
      { id: 'hs-chat', issue: '其他問題／不確定分類', channel: 'live_chat', contact: 'HARO／在線通訊', actionUrl: 'https://www.hangseng.com/zh-hk/personal/digital/live-chat/', sourceIds: ['hs-chat'], hours: '官方在線通訊：24 小時；未實測', note: '官方列明多種個人理財查詢；處理戶口指示可能需登入。' },
      { id: 'hs-lost', issue: '報失提款卡／信用卡／多貨幣扣賬卡', channel: 'phone', contact: '+852 2836 0838', actionUrl: 'tel:+85228360838', sourceIds: ['hs-contact'], hours: '官方報失熱線：24 小時', note: '官方專線；不建立虛假報失個案。是否立即到真人未測。' },
      { id: 'hs-atm', issue: '自動櫃員機查詢', channel: 'phone', contact: '+852 2997 2112', actionUrl: 'tel:+85229972112', sourceIds: ['hs-contact'], note: '官方 ATM 專線；按鍵待測。' },
      { id: 'hs-card', issue: '一般恒生信用卡／消費卡查詢', channel: 'phone', contact: '+852 2398 0000', actionUrl: 'tel:+85223980000', sourceIds: ['hs-contact'], note: '僅此卡種一般專線；其他卡種須查官方列表。交易爭議等細分問題的按鍵尚未取得。' },
      { id: 'hs-life', issue: '人壽保險', channel: 'phone', contact: '+852 2198 7838', actionUrl: 'tel:+85221987838', sourceIds: ['hs-contact'], note: '官方服務專線，細分問題／按鍵未測。' },
      { id: 'hs-insurance', issue: '一般保險', channel: 'phone', contact: '+852 2998 9888', actionUrl: 'tel:+85229989888', sourceIds: ['hs-contact'], note: '官方服務專線，細分問題／按鍵未測。' },
      { id: 'hs-medical', issue: '醫療保險', channel: 'phone', contact: '+852 2998 9886', actionUrl: 'tel:+85229989886', sourceIds: ['hs-contact'], note: '官方服務專線，細分問題／按鍵未測。' },
      { id: 'hs-mpf', issue: '強積金', channel: 'phone', contact: '+852 2997 2838', actionUrl: 'tel:+85229972838', sourceIds: ['hs-contact'], note: '官方服務專線，細分問題／按鍵未測。' },
      { id: 'hs-mortgage', issue: '按揭', channel: 'phone', contact: '+852 2710 2288', actionUrl: 'tel:+85227102288', sourceIds: ['hs-contact'], note: '官方服務專線，細分問題／按鍵未測。' },
      { id: 'hs-loan', issue: '私人貸款查詢', channel: 'phone', contact: '+852 2997 3882', actionUrl: 'tel:+85229973882', sourceIds: ['hs-contact'], note: '貸款服務專線；不混同貸款申請快線。按鍵待測。' },
      { id: 'hs-remittance', issue: '匯款', channel: 'phone', contact: '+852 2123 1088', actionUrl: 'tel:+85221231088', sourceIds: ['hs-contact'], note: '官方服務專線，細分問題／按鍵未測。' },
      { id: 'hs-fraud-route', issue: '可疑電話／訊息舉報', channel: 'phone', contact: '+852 2822 0228', actionUrl: 'tel:+85228220228', sourceIds: ['hs-fraud'], officialSteps: ['選擇語言後，按快速鍵 #，再按 9。'], note: '按鍵來自官方指引，未實測；不是一般問題的通用快捷鍵，不提交虛假舉報。' },
    ] },
  { id: 'ird', name: '稅務局', scope: '香港稅務局一般查詢及公開分類', menuComplete: false,
    remaining: '號碼是公開分類，未取得各熱線完整錄音／真人快捷鍵；國際電話是否可撥短碼待測。未找到可確認的一般客服 WhatsApp。',
    sources: [{ id: 'ird-contact', url: 'https://www.ird.gov.hk/eng/cu_enqs.htm', label: '稅務局官方查詢分類及時間' }],
    routes: [
      ...[['general','其他問題／不確定分類','1878088'],['holdover','暫緩繳交暫繳稅','1878011'],['individual','個人稅務／僱主薪酬及退休金報稅表','1878022'],['payment','繳稅事宜','1878033'],['property','物業稅','1878055']].map(([id,issue,number]) => ({ id: `ird-${id}`, issue, channel: 'phone' as const, contact: `+852 ${number}`, actionUrl: `tel:+852${number}`, sourceIds: ['ird-contact'], hours: '自動查詢：24 小時；職員：星期一至五 08:15–12:30、13:30–17:30', note: '官方分類電話，先進入自動系統；真人按鍵待測。' })),
    ] },
  { id: 'dhl', name: 'DHL', scope: '香港 DHL Express；不可套用至 DHL eCommerce／其他業務', menuComplete: false,
    remaining: 'WhatsApp 中英文官方頁面號碼不一致，先封鎖直接連結。貨件問題可能需要提單；電話／聊天選單尚未測試。',
    sources: [
      { id: 'dhl-zh', url: 'https://www.dhl.com/discover/zh-hk/ship-with-dhl/start-shipping/dhl-account-support-center', label: 'DHL Express 官方中文支援' },
      { id: 'dhl-en', url: 'https://www.dhl.com/discover/en-hk/ship-with-dhl/start-shipping/dhl-account-support-center', label: 'DHL Express 官方英文支援' },
    ], routes: [
      { id: 'dhl-general', issue: '其他問題／不確定分類', channel: 'phone', contact: '+852 2400 3388', actionUrl: 'tel:+85224003388', sourceIds: ['dhl-zh'], hours: '官方客服熱線：24 小時；未實測', note: '官方範圍包括收派件、付運進度、報價及包裝物料；按鍵待測。' },
      { id: 'dhl-tech', issue: 'MyDHL+／電子付運工具技術問題', channel: 'phone', contact: '+852 2400 3308', actionUrl: 'tel:+85224003308', sourceIds: ['dhl-zh'], hours: '星期一至五 09:00–17:40；週末及公眾假期休息', note: '官方技術支援專線；按鍵未測。' },
      { id: 'dhl-billing', issue: '帳單／發票查詢', channel: 'phone', contact: '+852 2400 3377', actionUrl: 'tel:+85224003377', sourceIds: ['dhl-zh'], hours: '星期一至五 09:00–17:40；週末及公眾假期休息', note: '官方帳務專線；按鍵未測。' },
      { id: 'dhl-wa', issue: '其他問題／不確定分類', channel: 'whatsapp', contact: '官方中文：+852 3001 6369；英文：+852 5745 4517', sourceIds: ['dhl-zh','dhl-en'], conflict: true, note: '來源不一致，未選定有效號碼。兩頁稱電子助理，不代表已接到真人；暫不提供直接聯絡按鈕。' },
    ] },
  { id: 'hktvmall', name: 'HKTVmall', scope: '消費者客服；不混入商戶服務或商品商家聊天', menuComplete: false,
    remaining: '客服頁是動態內容；訂單、退換貨等真人選單待瀏覽器實测。本輪未确认可供一般消費者使用的電話／WhatsApp，不等於不存在。',
    sources: [
      { id: 'hktv-help', url: 'https://www.hktvmall.com/hktv/zh/cs-help', label: 'HKTVmall 官方客服入口' },
      { id: 'hktv-lite', url: 'https://cloud.marketing.hktvmall.com/LiteApp_QA?autoTriggerApp=true', label: '官方簡易版 FAQ 的客服說明' },
    ], routes: [
      { id: 'hktv-chat', issue: '其他問題／不確定分類', channel: 'live_chat', contact: '官方網頁／普通版本 App 客戶服務', actionUrl: 'https://www.hktvmall.com/hktv/zh/cs-help', sourceIds: ['hktv-help','hktv-lite'], note: '官方 FAQ 指向普通版本網頁／App 即時對話。真人入口、登入／訂單要求、開放時間及選單待測。' },
    ] },
];
