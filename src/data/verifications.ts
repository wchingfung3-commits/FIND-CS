import type { Verification } from "@/types";

export const verifications: Verification[] = [
  {
    id: "v-hsbc-phone-1",
    routeId: "hsbc-phone-general",
    testDate: "2026-09-18",
    testPeriod: "service_hours",
    result: "human_reached",
    evidence: "按上述步驟於 14:32 成功轉接真人客服",
  },
  {
    id: "v-hsbc-livechat-1",
    routeId: "hsbc-livechat-general",
    testDate: "2026-09-18",
    testPeriod: "service_hours",
    result: "human_reached",
    evidence: "Live Chat 輸入「轉真人」後 3 分鐘內有真人回覆",
  },
  {
    id: "v-hsbc-whatsapp-1",
    routeId: "hsbc-whatsapp-general",
    testDate: "2026-09-18",
    testPeriod: "service_hours",
    result: "human_reached",
    evidence: "WhatsApp 輸入「0」後 5 分鐘內有真人回覆",
  },
  {
    id: "v-klook-livechat-1",
    routeId: "klook-livechat-general",
    testDate: "2026-09-18",
    testPeriod: "service_hours",
    result: "human_reached",
    evidence: "Live Chat 要求轉真人後 2 分鐘內有真人回覆",
  },
  {
    id: "v-cathay-phone-1",
    routeId: "cathay-phone-general",
    testDate: "2026-09-18",
    testPeriod: "after_hours",
    result: "human_reached",
    evidence: "24 小時熱線，凌晨 02:15 仍可轉接真人",
  },
];
