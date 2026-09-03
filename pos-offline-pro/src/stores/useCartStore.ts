import { create } from "zustand";
import { Product, ProductVariant } from "@/db";

export interface CartItem {
  id: string; // unique cart item id (product.id + variantId)
  product: Product;
  variant?: ProductVariant | null;
  unitPrice: number;
  modalHpp: number;
  qty: number; // can be float, e.g. 0.5 kg or 0.4 kg
  unit: string;
  subtotal: number;
  subtotalHpp: number;
  discountType?: "PERCENT" | "NOMINAL" | null;
  discountValue?: number;
  discountAmount?: number;
}

interface CartState {
  items: CartItem[];
  note: string;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  activeOpenBillId?: string | null;
  isPpnEnabled: boolean;
  ppnRate: number; // e.g. 11

  setNote: (note: string) => void;
  setTableNumber: (tableNumber: string) => void;
  setCustomerName: (customerName: string) => void;
  setCustomerPhone: (customerPhone: string) => void;
  setActiveOpenBillId: (activeOpenBillId?: string | null) => void;
  setPpnEnabled: (enabled: boolean) => void;
  setPpnRate: (rate: number) => void;

  addItem: (
    product: Product,
    qty?: number,
    variant?: ProductVariant | null,
    customPrice?: number
  ) => { success: boolean; message?: string };

  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, newQty: number) => { success: boolean; message?: string };
  setItemDiscount: (
    itemId: string,
    discountType: "PERCENT" | "NOMINAL",
    discountValue: number
  ) => void;
  clearItemDiscount: (itemId: string) => void;
  loadItemsFromOpenBill: (
    items: CartItem[],
    billMeta: {
      tableNumber?: string;
      customerName?: string;
      customerPhone?: string;
      openBillId: string;
    }
  ) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getPpnAmount: () => number;
  getGrandTotal: () => number;
  getTotalHpp: () => number;
  getTotalLabaKotor: () => number;
  getTotalItemCount: () => number;
  getTotalItemDiscount: () => number;
}

function calculateItemSubtotal(
  qty: number,
  unitPrice: number,
  discountType?: "PERCENT" | "NOMINAL" | null,
  discountValue?: number
): { subtotal: number; discountAmount: number } {
  const rawTotal = qty * unitPrice;
  let discountAmount = 0;

  if (discountType === "PERCENT" && discountValue && discountValue > 0) {
    discountAmount = Math.round((rawTotal * Math.min(100, discountValue)) / 100);
  } else if (discountType === "NOMINAL" && discountValue && discountValue > 0) {
    discountAmount = Math.min(rawTotal, Math.round(discountValue));
  }

  const subtotal = Math.max(0, Math.round(rawTotal - discountAmount));
  return { subtotal, discountAmount };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  note: "",
  tableNumber: "",
  customerName: "",
  customerPhone: "",
  activeOpenBillId: null,
  isPpnEnabled: true,
  ppnRate: 11,

  setNote: (note: string) => set({ note }),
  setTableNumber: (tableNumber: string) => set({ tableNumber }),
  setCustomerName: (customerName: string) => set({ customerName }),
  setCustomerPhone: (customerPhone: string) => set({ customerPhone }),
  setActiveOpenBillId: (activeOpenBillId?: string | null) => set({ activeOpenBillId }),
  setPpnEnabled: (isPpnEnabled: boolean) => set({ isPpnEnabled }),
  setPpnRate: (ppnRate: number) => set({ ppnRate }),

  addItem: (product: Product, addQty = 1, variant = null, customPrice) => {
    const { items } = get();
    const itemId = variant ? `${product.id}_${variant.id}` : product.id;
    const existingIndex = items.findIndex((i) => i.id === itemId);

    const price = customPrice !== undefined ? customPrice : variant ? variant.harga_jual : product.harga_jual;
    const hpp = variant ? variant.modal_hpp : product.modal_hpp;
    const maxStock = variant ? variant.stock : product.stock;

    if (maxStock <= 0) {
      return {
        success: false,
        message: `Stok "${product.name}${variant ? ` (${variant.name})` : ""}" telah habis.`,
      };
    }

    if (existingIndex > -1) {
      const currentItem = items[existingIndex];
      const targetQty = currentItem.qty + addQty;

      if (targetQty > maxStock) {
        return {
          success: false,
          message: `Stok tidak mencukupi. Maksimal stok tersedia: ${maxStock} ${product.unit || "pcs"}`,
        };
      }

      const { subtotal, discountAmount } = calculateItemSubtotal(
        targetQty,
        price,
        currentItem.discountType,
        currentItem.discountValue
      );

      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...currentItem,
        qty: targetQty,
        subtotal,
        discountAmount,
        subtotalHpp: Math.round(targetQty * hpp),
      };

      set({ items: updatedItems });
      return { success: true };
    } else {
      if (addQty > maxStock) {
        return {
          success: false,
          message: `Stok tidak mencukupi. Maksimal stok tersedia: ${maxStock} ${product.unit || "pcs"}`,
        };
      }

      const { subtotal, discountAmount } = calculateItemSubtotal(addQty, price, null, 0);

      const newItem: CartItem = {
        id: itemId,
        product,
        variant,
        unitPrice: price,
        modalHpp: hpp,
        qty: addQty,
        unit: product.unit || "pcs",
        subtotal,
        discountAmount,
        discountType: null,
        discountValue: 0,
        subtotalHpp: Math.round(addQty * hpp),
      };

      set({ items: [...items, newItem] });
      return { success: true };
    }
  },

  removeItem: (itemId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
  },

  updateQty: (itemId: string, newQty: number) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.id === itemId);

    if (existingIndex === -1) {
      return { success: false, message: "Item tidak ditemukan di keranjang." };
    }

    if (newQty <= 0) {
      get().removeItem(itemId);
      return { success: true };
    }

    const item = items[existingIndex];
    const maxStock = item.variant ? item.variant.stock : item.product.stock;

    if (newQty > maxStock) {
      return {
        success: false,
        message: `Stok tidak mencukupi. Maksimal stok: ${maxStock} ${item.unit}`,
      };
    }

    const { subtotal, discountAmount } = calculateItemSubtotal(
      newQty,
      item.unitPrice,
      item.discountType,
      item.discountValue
    );

    const updatedItems = [...items];
    updatedItems[existingIndex] = {
      ...item,
      qty: newQty,
      subtotal,
      discountAmount,
      subtotalHpp: Math.round(newQty * item.modalHpp),
    };

    set({ items: updatedItems });
    return { success: true };
  },

  setItemDiscount: (itemId, discountType, discountValue) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.id === itemId);
    if (existingIndex === -1) return;

    const item = items[existingIndex];
    const { subtotal, discountAmount } = calculateItemSubtotal(
      item.qty,
      item.unitPrice,
      discountType,
      discountValue
    );

    const updatedItems = [...items];
    updatedItems[existingIndex] = {
      ...item,
      discountType,
      discountValue,
      discountAmount,
      subtotal,
    };

    set({ items: updatedItems });
  },

  clearItemDiscount: (itemId) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.id === itemId);
    if (existingIndex === -1) return;

    const item = items[existingIndex];
    const { subtotal, discountAmount } = calculateItemSubtotal(item.qty, item.unitPrice, null, 0);

    const updatedItems = [...items];
    updatedItems[existingIndex] = {
      ...item,
      discountType: null,
      discountValue: 0,
      discountAmount,
      subtotal,
    };

    set({ items: updatedItems });
  },

  loadItemsFromOpenBill: (items, billMeta) => {
    set({
      items,
      tableNumber: billMeta.tableNumber || "",
      customerName: billMeta.customerName || "",
      customerPhone: billMeta.customerPhone || "",
      activeOpenBillId: billMeta.openBillId,
    });
  },

  clearCart: () =>
    set({
      items: [],
      note: "",
      tableNumber: "",
      customerName: "",
      customerPhone: "",
      activeOpenBillId: null,
    }),

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.subtotal, 0);
  },

  getPpnAmount: () => {
    const { isPpnEnabled, ppnRate } = get();
    if (!isPpnEnabled || ppnRate <= 0) return 0;
    const subtotal = get().getSubtotal();
    return Math.round((subtotal * ppnRate) / 100);
  },

  getGrandTotal: () => {
    return get().getSubtotal() + get().getPpnAmount();
  },

  getTotalHpp: () => {
    return get().items.reduce((acc, item) => acc + item.subtotalHpp, 0);
  },

  getTotalLabaKotor: () => {
    return get().getSubtotal() - get().getTotalHpp();
  },

  getTotalItemCount: () => {
    return get().items.reduce((acc, item) => acc + (item.unit === "kg" ? 1 : item.qty), 0);
  },

  getTotalItemDiscount: () => {
    return get().items.reduce((acc, item) => acc + (item.discountAmount || 0), 0);
  },
}));
