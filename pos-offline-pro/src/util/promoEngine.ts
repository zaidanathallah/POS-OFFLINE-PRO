/**
 * Promo Calculation Engine for POS Offline Pro (100% Offline)
 * Evaluates Cart Items against Active Promos (Buy X Get Y, Combo Discounts, Min Spend)
 */
import { Promo } from "@/db";
import { CartItem } from "@/stores/useCartStore";

export interface AppliedPromoResult {
  promo: Promo;
  discountAmount: number;
  description: string;
}

export interface PromoEvaluation {
  appliedPromos: AppliedPromoResult[];
  totalDiscount: number;
  netSubtotal: number;
}

export function evaluateCartPromos(
  items: CartItem[],
  activePromos: Promo[]
): PromoEvaluation {
  if (!items || items.length === 0 || !activePromos || activePromos.length === 0) {
    return {
      appliedPromos: [],
      totalDiscount: 0,
      netSubtotal: items.reduce((acc, i) => acc + i.subtotal, 0),
    };
  }

  const rawSubtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const appliedList: AppliedPromoResult[] = [];
  let totalDiscountAccumulated = 0;

  for (const promo of activePromos) {
    if (!promo.is_active) continue;

    // 1. Tipe: BUY_X_GET_Y (Beli X Gratis Y, misal Beli 2 Gratis 1)
    if (promo.promo_type === "BUY_X_GET_Y") {
      const qualifyingItems = items.filter((item) => {
        if (promo.target_type === "ALL") return true;
        if (promo.target_type === "CATEGORY" && promo.target_id) {
          return item.product.category?.toLowerCase() === promo.target_id.toLowerCase();
        }
        if (promo.target_type === "PRODUCT" && promo.target_id) {
          return item.product.id === promo.target_id;
        }
        return true;
      });

      const totalQualifyingQty = qualifyingItems.reduce((acc, i) => acc + i.qty, 0);
      const bundleSize = promo.min_qty + promo.reward_free_qty; // e.g. 2 + 1 = 3

      if (bundleSize > 0 && totalQualifyingQty >= bundleSize) {
        const bundleCount = Math.floor(totalQualifyingQty / bundleSize);
        const totalFreeItems = bundleCount * promo.reward_free_qty;

        // Calculate discount based on qualifying item prices (from lowest price to highest)
        const unitPrices: number[] = [];
        qualifyingItems.forEach((item) => {
          for (let q = 0; q < Math.floor(item.qty); q++) {
            unitPrices.push(item.unitPrice);
          }
        });
        unitPrices.sort((a, b) => a - b);

        const freePrices = unitPrices.slice(0, totalFreeItems);
        const discountVal = freePrices.reduce((sum, p) => sum + p, 0);

        if (discountVal > 0) {
          appliedList.push({
            promo,
            discountAmount: discountVal,
            description: `${promo.name} (${totalFreeItems} item gratis)`,
          });
          totalDiscountAccumulated += discountVal;
        }
      }
    }

    // 2. Tipe: COMBO_DISCOUNT (Beli X item rasa/varian apapun dapat diskon Rp atau %)
    else if (promo.promo_type === "COMBO_DISCOUNT") {
      const qualifyingItems = items.filter((item) => {
        if (promo.target_type === "ALL") return true;
        if (promo.target_type === "CATEGORY" && promo.target_id) {
          return item.product.category?.toLowerCase() === promo.target_id.toLowerCase();
        }
        if (promo.target_type === "PRODUCT" && promo.target_id) {
          return item.product.id === promo.target_id;
        }
        return true;
      });

      const totalQualifyingQty = qualifyingItems.reduce((acc, i) => acc + i.qty, 0);
      const qualifyingSubtotal = qualifyingItems.reduce((acc, i) => acc + i.subtotal, 0);

      if (promo.min_qty > 0 && totalQualifyingQty >= promo.min_qty) {
        const comboMultiplier = Math.floor(totalQualifyingQty / promo.min_qty);
        let discountVal = 0;

        if (promo.discount_amount > 0) {
          discountVal = comboMultiplier * promo.discount_amount;
        } else if (promo.discount_percent > 0) {
          discountVal = Math.round((qualifyingSubtotal * promo.discount_percent) / 100);
        }

        // Cap discount so it does not exceed qualifying subtotal
        discountVal = Math.min(discountVal, qualifyingSubtotal);

        if (discountVal > 0) {
          appliedList.push({
            promo,
            discountAmount: discountVal,
            description: `${promo.name}`,
          });
          totalDiscountAccumulated += discountVal;
        }
      }
    }

    // 3. Tipe: MIN_SPEND (Belanja minimal Rp X dapat diskon)
    else if (promo.promo_type === "MIN_SPEND") {
      if (rawSubtotal >= promo.min_spend) {
        let discountVal = 0;
        if (promo.discount_amount > 0) {
          discountVal = promo.discount_amount;
        } else if (promo.discount_percent > 0) {
          discountVal = Math.round((rawSubtotal * promo.discount_percent) / 100);
        }

        discountVal = Math.min(discountVal, rawSubtotal);

        if (discountVal > 0) {
          appliedList.push({
            promo,
            discountAmount: discountVal,
            description: `${promo.name}`,
          });
          totalDiscountAccumulated += discountVal;
        }
      }
    }
  }

  // Prevent total discount from exceeding total subtotal
  const finalDiscount = Math.min(totalDiscountAccumulated, rawSubtotal);
  const netSubtotal = Math.max(0, rawSubtotal - finalDiscount);

  return {
    appliedPromos: appliedList,
    totalDiscount: finalDiscount,
    netSubtotal,
  };
}
