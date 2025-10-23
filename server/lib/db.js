const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { resolveFromRoot } = require('./paths');

const dataDirectory = resolveFromRoot('data');
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const DB_PATH = resolveFromRoot('data', 'products.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database', err);
  }
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function callback(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });

const defaultProducts = [
  {
    name: 'Classic Leather Wallet',
    price: 49.99,
    category: 'Accessories',
    description: 'Handcrafted genuine leather wallet with RFID protection.',
    image:
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Minimalist Wristwatch',
    price: 129.0,
    category: 'Accessories',
    description: 'Stainless steel case with sapphire crystal and leather strap.',
    image:
      'https://images.unsplash.com/photo-1518544889280-45e21f2a0d91?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Canvas Tote Bag',
    price: 39.5,
    category: 'Bags',
    description: 'Durable organic cotton tote bag perfect for daily errands.',
    image:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Espresso Ceramic Mug',
    price: 24.99,
    category: 'Home',
    description: 'Handmade ceramic mug with matte glaze and ergonomic handle.',
    image:
      'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=800&q=80'
  }
];

async function initializeDb() {
  await run(
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      description TEXT,
      image TEXT,
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  const [{ count }] = await all('SELECT COUNT(*) as count FROM products');

  if (count === 0) {
    for (const product of defaultProducts) {
      await run(
        `INSERT INTO products (name, price, category, description, image, featured)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product.name, product.price, product.category, product.description, product.image, 0]
      );
    }
  }
}

async function listProducts(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.category) {
    clauses.push('category = ?');
    params.push(filters.category);
  }

  if (filters.minPrice !== undefined) {
    clauses.push('price >= ?');
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    clauses.push('price <= ?');
    params.push(filters.maxPrice);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return all(`SELECT * FROM products ${where} ORDER BY created_at DESC`, params);
}

function getProductById(id) {
  return get('SELECT * FROM products WHERE id = ?', [id]);
}

async function createProduct(data) {
  const now = new Date().toISOString();
  const result = await run(
    `INSERT INTO products (name, price, category, description, image, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.price, data.category, data.description, data.image, data.featured ? 1 : 0, now, now]
  );
  return getProductById(result.id);
}

async function updateProduct(id, data) {
  const existing = await getProductById(id);
  if (!existing) {
    return null;
  }
  const now = new Date().toISOString();
  await run(
    `UPDATE products SET
      name = ?,
      price = ?,
      category = ?,
      description = ?,
      image = ?,
      featured = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      data.name,
      data.price,
      data.category,
      data.description,
      data.image,
      data.featured ? 1 : 0,
      now,
      id
    ]
  );
  return getProductById(id);
}

async function deleteProduct(id) {
  const existing = await getProductById(id);
  if (!existing) {
    return false;
  }
  await run('DELETE FROM products WHERE id = ?', [id]);
  return true;
}

module.exports = {
  initializeDb,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
