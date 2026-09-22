import type { Issue } from "@/types";

export const issues: Issue[] = [
  // HSBC
  { id: "hsbc-credit-stolen", companyId: "hsbc", name: "信用卡被盜用", description: "信用卡被盜用或未授權交易" },
  { id: "hsbc-online-banking", companyId: "hsbc", name: "網上銀行問題", description: "網上銀行登入或操作問題" },
  { id: "hsbc-transfer", companyId: "hsbc", name: "轉帳問題", description: "轉帳失敗或延遲" },
  { id: "hsbc-mortgage", companyId: "hsbc", name: "按揭", description: "物業按揭查詢" },
  { id: "hsbc-app", companyId: "hsbc", name: "App 問題", description: "HSBC HK App 操作問題" },
  // PCCW
  { id: "pccw-internet", companyId: "pccw", name: "寬頻上網問題", description: "網絡連線中斷或速度慢" },
  { id: "pccw-mobile", companyId: "pccw", name: "流動電話問題", description: "手提網絡或月費查詢" },
  { id: "pccw-billing", companyId: "pccw", name: "帳單問題", description: "帳單收費查詢" },
];
