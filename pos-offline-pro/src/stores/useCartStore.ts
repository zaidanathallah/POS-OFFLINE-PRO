import { create } from "zustand";
import { Product } from "@/db";

export interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
  subtotalHpp: number;
}

interface CartState {
  items: CartItem[];
  note: string;
  setNote: (note: string) => void;
  addItem: (product: Product, qty?: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => { success: boolean; message?: string };
  clearCart: () => void;
  getTotalOmset: () => number;
  getTotalHpp: () => number;
  getTotalLabaKotor: () => number;
  getTotalItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  note: "",

  setNote: (note: string) => set({ note }),

  addItem: (product: Product, addQty = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    if (product.stock <= 0) {
      return { success: false, message: `Stok "${product.name}" telah habis.` };
    }

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].qty;
      const targetQty = currentQty + addQty;

      if (targetQty > product.stock) {
        return {
          success: false,
          message: `Stok tidak mencukupi. Maksimal stok tersedia: ${product.stock}`,
        };
      }

      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        product,
        qty: targetQty,
        subtotal: targetQty * product.harga_jual,
        subtotalHpp: targetQty * product.modal_hpp,
      };

      set({ items: updatedItems });
      return { success: true };
    } else {
      if (addQty > product.stock) {
        return {
          success: false,
          message: `Stok tidak mencukupi. Maksimal stok tersedia: ${product.stock}`,
        };
      }

      const newItem: CartItem = {
        product,
        qty: addQty,
        subtotal: addQty * product.harga_jual,
        subtotalHpp: addQty * product.modal_hpp,
      };

      set({ items: [...items, newItem] });
      return { success: true };
    }
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQty: (productId: string, newQty: number) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.product.id === productId);

    if (existingIndex === -1) {
      return { success: false, message: "Produk tidak ada di keranjang." };
    }

    if (newQty <= 0) {
      get().removeItem(productId);
      return { success: true };
    }

    const item = items[existingIndex];
    if (newQty > item.product.stock) {
      return {
        success: false,
        message: `Stok tidak mencukupi. Maksimal stok: ${item.product.stock}`,
      };
    }

    const updatedItems = [...items];
    updatedItems[existingIndex] = {
      ...item,
      qty: newQty,
      subtotal: newQty * item.product.harga_jual,
      subtotalHpp: newQty * item.product.modal_hpp,
    };

    set({ items: updatedItems });
    return { success: true };
  },

  clearCart: () => set({ items: [], note: "" }),

  getTotalOmset: () => {
    return get().items.reduce((acc, item) => acc + item.subtotal, 0);
  },

  getTotalHpp: () => {
    return get().items.reduce((acc, item) => acc + item.subtotalHpp, 0);
  },

  getTotalLabaKotor: () => {
    return get().getTotalOmset() - get().getTotalHpp();
  },

  getTotalItemCount: () => {
    return get().items.reduce((acc, item) => acc + item.qty, 0);
  },
}));
