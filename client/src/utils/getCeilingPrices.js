// /src/utils/getCeilingPrices.js
import priceConfig from '../pages/priceConfig';

export default function getCeilingPrices() {
  try {
    const s = JSON.parse(localStorage.getItem('ceilingPrices') || '{}');
    return {
      mt: Number(s.priceMT ?? priceConfig.mt),
      ct: Number(s.priceCT ?? priceConfig.ct),
      panel: Number(s.pricePanel ?? priceConfig.panel),
      wa: Number(s.priceWA ?? priceConfig.wa),
    };
  } catch {
    return {
      mt: priceConfig.mt,
      ct: priceConfig.ct,
      panel: priceConfig.panel,
      wa: priceConfig.wa,
    };
  }
}
