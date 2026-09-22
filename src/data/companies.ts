import type { Company } from "@/types";

export const companies: Company[] = [
  // 銀行
  {
    id: "hsbc",
    name: "HSBC",
    industry: "banking",
    description: "香港上海滙豐銀行",
    officialUrl: "https://www.hsbc.com.hk",
    supportModel: "router",
  },
  {
    id: "hangseng",
    name: "恒生銀行",
    industry: "banking",
    description: "恒生銀行有限公司",
    officialUrl: "https://www.hangseng.com",
    supportModel: "simple",
  },
  {
    id: "boc",
    name: "中銀香港",
    industry: "banking",
    description: "中國銀行（香港）",
    officialUrl: "https://www.bochk.com",
    supportModel: "simple",
  },
  {
    id: "scb",
    name: "渣打銀行",
    industry: "banking",
    description: "渣打銀行（香港）",
    officialUrl: "https://www.sc.com/hk",
    supportModel: "simple",
  },
  {
    id: "citi",
    name: "花旗銀行",
    industry: "banking",
    description: "花旗銀行（香港）",
    officialUrl: "https://www.citibank.com.hk",
    supportModel: "simple",
  },
  // 旅遊
  {
    id: "cathay",
    name: "國泰航空",
    industry: "travel",
    description: "國泰航空公司",
    officialUrl: "https://www.cathaypacific.com",
    supportModel: "simple",
  },
  {
    id: "klook",
    name: "Klook",
    industry: "travel",
    description: "Klook 客路",
    officialUrl: "https://www.klook.com",
    supportModel: "simple",
  },
  // 物流
  {
    id: "sf",
    name: "順豐",
    industry: "logistics",
    description: "順豐速運",
    officialUrl: "https://www.sf-express.com",
    supportModel: "simple",
  },
  // 電商
  {
    id: "hktvmall",
    name: "HKTVmall",
    industry: "ecommerce",
    description: "香港電視網絡購物平台",
    officialUrl: "https://www.hktvmall.com",
    supportModel: "simple",
  },
  // 電訊
  {
    id: "pccw",
    name: "PCCW",
    industry: "telecom",
    description: "電訊盈科",
    officialUrl: "https://www.pccw.com",
    supportModel: "router",
  },
  // 保險
  {
    id: "prudential",
    name: "保誠",
    industry: "insurance",
    description: "英國保誠保險",
    officialUrl: "https://www.prudential.com.hk",
    supportModel: "simple",
  },
  // 外賣
  {
    id: "foodpanda",
    name: "foodpanda",
    industry: "delivery",
    description: "foodpanda 外賣平台",
    officialUrl: "https://www.foodpanda.hk",
    supportModel: "simple",
  },
  // 政府
  {
    id: "gov1823",
    name: "政府一站通 1823",
    industry: "government",
    description: "政府一站通 1823 熱線",
    officialUrl: "https://www.gov.hk",
    supportModel: "simple",
  },
];
