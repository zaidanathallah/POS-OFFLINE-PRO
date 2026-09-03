import { runInDbQueue, Customer } from "./index";

/**
 * Customer CRM Repository for POS Offline Pro
 * 100% Offline SQLite database
 */

export async function getAllCustomers(sortBy: "name" | "spent" | "recent" = "recent"): Promise<Customer[]> {
  return await runInDbQueue(async (db) => {
    let orderBy = "created_at DESC";
    if (sortBy === "name") orderBy = "name ASC";
    if (sortBy === "spent") orderBy = "total_spent DESC";

    return await db.getAllAsync<Customer>(
      `SELECT * FROM customers ORDER BY ${orderBy}`
    );
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return await runInDbQueue(async (db) => {
    return await db.getFirstAsync<Customer>(
      "SELECT * FROM customers WHERE id = ?",
      [id]
    );
  });
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  if (!phone || !phone.trim()) return null;
  return await runInDbQueue(async (db) => {
    return await db.getFirstAsync<Customer>(
      "SELECT * FROM customers WHERE phone = ?",
      [phone.trim()]
    );
  });
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  if (!query || !query.trim()) return await getAllCustomers();
  const q = `%${query.trim()}%`;
  return await runInDbQueue(async (db) => {
    return await db.getAllAsync<Customer>(
      "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY total_spent DESC LIMIT 30",
      [q, q]
    );
  });
}

export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  if (!input.name || !input.name.trim()) {
    throw new Error("Nama pelanggan wajib diisi.");
  }

  return await runInDbQueue(async (db) => {
    const id = `CUST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const name = input.name.trim();
    const phone = input.phone ? input.phone.trim() : null;
    const email = input.email ? input.email.trim() : null;
    const address = input.address ? input.address.trim() : null;
    const notes = input.notes ? input.notes.trim() : null;
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO customers (id, name, phone, email, address, notes, total_orders, total_spent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [id, name, phone, email, address, notes, createdAt]
    );

    return {
      id,
      name,
      phone,
      email,
      address,
      notes,
      total_orders: 0,
      total_spent: 0,
      created_at: createdAt,
    };
  });
}

export async function updateCustomer(
  id: string,
  input: Partial<CreateCustomerInput>
): Promise<void> {
  return await runInDbQueue(async (db) => {
    const existing = await db.getFirstAsync<Customer>("SELECT * FROM customers WHERE id = ?", [id]);
    if (!existing) throw new Error("Pelanggan tidak ditemukan.");

    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const phone = input.phone !== undefined ? (input.phone ? input.phone.trim() : null) : existing.phone;
    const email = input.email !== undefined ? (input.email ? input.email.trim() : null) : existing.email;
    const address = input.address !== undefined ? (input.address ? input.address.trim() : null) : existing.address;
    const notes = input.notes !== undefined ? (input.notes ? input.notes.trim() : null) : existing.notes;

    await db.runAsync(
      `UPDATE customers 
       SET name = ?, phone = ?, email = ?, address = ?, notes = ?
       WHERE id = ?`,
      [name, phone ?? null, email ?? null, address ?? null, notes ?? null, id]
    );
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return await runInDbQueue(async (db) => {
    await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
  });
}

/**
 * Record a transaction into customer CRM (updates total_orders and total_spent)
 * If customer does not exist but name & phone provided, creates automatically.
 */
export async function recordCustomerTransaction(
  name?: string | null,
  phone?: string | null,
  amount: number = 0,
  dbInstance?: any
): Promise<void> {
  if (!name && !phone) return;

  let cleanName = (name || "").trim();
  let cleanPhone = (phone || "").trim();

  // If user entered format "budi/0818282321" in name input
  if (cleanName.includes("/")) {
    const parts = cleanName.split("/");
    cleanName = parts[0]?.trim() || cleanName;
    if (!cleanPhone && parts[1]) {
      cleanPhone = parts[1].trim();
    }
  }

  const execute = async (db: any) => {
    try {
      let customer: Customer | null = null;
      if (cleanPhone) {
        customer = await db.getFirstAsync(
          "SELECT * FROM customers WHERE phone = ?",
          [cleanPhone]
        );
      }
      if (!customer && cleanName) {
        customer = await db.getFirstAsync(
          "SELECT * FROM customers WHERE LOWER(name) = LOWER(?)",
          [cleanName]
        );
      }

      if (customer) {
        await db.runAsync(
          `UPDATE customers 
           SET total_orders = total_orders + 1, total_spent = total_spent + ?
           WHERE id = ?`,
          [amount, customer.id]
        );
      } else if (cleanName) {
        const newId = `CUST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        await db.runAsync(
          `INSERT INTO customers (id, name, phone, email, address, notes, total_orders, total_spent, created_at)
           VALUES (?, ?, ?, null, null, 'Dibuat otomatis dari kasir', 1, ?, ?)`,
          [newId, cleanName, cleanPhone || null, amount, new Date().toISOString()]
        );
      }
    } catch (e) {
      console.log("Record customer transaction notice:", e);
    }
  };

  if (dbInstance) {
    return await execute(dbInstance);
  }
  return await runInDbQueue(execute);
}
