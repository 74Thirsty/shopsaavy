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

const defaultSiteContent = {
  heroBadge: 'SaavyShop Demo',
  heroTitle: 'Showcase products beautifully and update inventory without code.',
  heroDescription:
    'This retail demo website pairs a premium storefront with an intuitive admin panel. Update product details, swap imagery, and launch campaigns in minutes.',
  heroPrimaryLabel: 'Explore Products',
  heroPrimaryUrl: '/shop',
  heroSecondaryLabel: 'Manage Catalog',
  heroSecondaryUrl: '/admin',
  heroImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80',
  heroSpotlightEyebrow: 'Featured Collection',
  heroSpotlightTitle: 'Curate a stunning brand showcase',
  featuredEyebrow: 'Featured',
  featuredTitle: 'Product highlights',
  featuredDescription:
    'Demonstrate merchandising strategy with a curated product grid. Update featured collections instantly from the admin panel.',
  spotlightEyebrow: 'No-code admin tool',
  spotlightTitle: 'Empower clients to launch updates without engineering tickets.',
  spotlightDescription:
    'Editable tables, instant image previews, and confirmation modals make management effortless. Preview the admin workspace to see how your clients can own product storytelling.',
  spotlightCtaLabel: 'Open admin panel',
  spotlightCtaUrl: '/admin'
};

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

  await run(
    `CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hero_badge TEXT NOT NULL,
      hero_title TEXT NOT NULL,
      hero_description TEXT NOT NULL,
      hero_primary_label TEXT NOT NULL,
      hero_primary_url TEXT NOT NULL,
      hero_secondary_label TEXT NOT NULL,
      hero_secondary_url TEXT NOT NULL,
      hero_image TEXT NOT NULL,
      hero_spotlight_eyebrow TEXT NOT NULL,
      hero_spotlight_title TEXT NOT NULL,
      featured_eyebrow TEXT NOT NULL,
      featured_title TEXT NOT NULL,
      featured_description TEXT NOT NULL,
      spotlight_eyebrow TEXT NOT NULL,
      spotlight_title TEXT NOT NULL,
      spotlight_description TEXT NOT NULL,
      spotlight_cta_label TEXT NOT NULL,
      spotlight_cta_url TEXT NOT NULL
    )`
  );

  const existingSiteContent = await get('SELECT * FROM site_content WHERE id = 1');
  if (!existingSiteContent) {
    await run(
      `INSERT INTO site_content (
        id,
        hero_badge,
        hero_title,
        hero_description,
        hero_primary_label,
        hero_primary_url,
        hero_secondary_label,
        hero_secondary_url,
        hero_image,
        hero_spotlight_eyebrow,
        hero_spotlight_title,
        featured_eyebrow,
        featured_title,
        featured_description,
        spotlight_eyebrow,
        spotlight_title,
        spotlight_description,
        spotlight_cta_label,
        spotlight_cta_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        defaultSiteContent.heroBadge,
        defaultSiteContent.heroTitle,
        defaultSiteContent.heroDescription,
        defaultSiteContent.heroPrimaryLabel,
        defaultSiteContent.heroPrimaryUrl,
        defaultSiteContent.heroSecondaryLabel,
        defaultSiteContent.heroSecondaryUrl,
        defaultSiteContent.heroImage,
        defaultSiteContent.heroSpotlightEyebrow,
        defaultSiteContent.heroSpotlightTitle,
        defaultSiteContent.featuredEyebrow,
        defaultSiteContent.featuredTitle,
        defaultSiteContent.featuredDescription,
        defaultSiteContent.spotlightEyebrow,
        defaultSiteContent.spotlightTitle,
        defaultSiteContent.spotlightDescription,
        defaultSiteContent.spotlightCtaLabel,
        defaultSiteContent.spotlightCtaUrl
      ]
    );
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

function mapSiteContent(row) {
  if (!row) {
    return null;
  }
  return {
    heroBadge: row.hero_badge,
    heroTitle: row.hero_title,
    heroDescription: row.hero_description,
    heroPrimaryLabel: row.hero_primary_label,
    heroPrimaryUrl: row.hero_primary_url,
    heroSecondaryLabel: row.hero_secondary_label,
    heroSecondaryUrl: row.hero_secondary_url,
    heroImage: row.hero_image,
    heroSpotlightEyebrow: row.hero_spotlight_eyebrow,
    heroSpotlightTitle: row.hero_spotlight_title,
    featuredEyebrow: row.featured_eyebrow,
    featuredTitle: row.featured_title,
    featuredDescription: row.featured_description,
    spotlightEyebrow: row.spotlight_eyebrow,
    spotlightTitle: row.spotlight_title,
    spotlightDescription: row.spotlight_description,
    spotlightCtaLabel: row.spotlight_cta_label,
    spotlightCtaUrl: row.spotlight_cta_url
  };
}

async function getSiteContent() {
  const row = await get('SELECT * FROM site_content WHERE id = 1');
  if (!row) {
    return defaultSiteContent;
  }
  return mapSiteContent(row);
}

async function updateSiteContent(data) {
  await run(
    `UPDATE site_content SET
      hero_badge = ?,
      hero_title = ?,
      hero_description = ?,
      hero_primary_label = ?,
      hero_primary_url = ?,
      hero_secondary_label = ?,
      hero_secondary_url = ?,
      hero_image = ?,
      hero_spotlight_eyebrow = ?,
      hero_spotlight_title = ?,
      featured_eyebrow = ?,
      featured_title = ?,
      featured_description = ?,
      spotlight_eyebrow = ?,
      spotlight_title = ?,
      spotlight_description = ?,
      spotlight_cta_label = ?,
      spotlight_cta_url = ?
     WHERE id = 1`,
    [
      data.heroBadge,
      data.heroTitle,
      data.heroDescription,
      data.heroPrimaryLabel,
      data.heroPrimaryUrl,
      data.heroSecondaryLabel,
      data.heroSecondaryUrl,
      data.heroImage,
      data.heroSpotlightEyebrow,
      data.heroSpotlightTitle,
      data.featuredEyebrow,
      data.featuredTitle,
      data.featuredDescription,
      data.spotlightEyebrow,
      data.spotlightTitle,
      data.spotlightDescription,
      data.spotlightCtaLabel,
      data.spotlightCtaUrl
    ]
  );

  return getSiteContent();
}

module.exports = {
  initializeDb,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSiteContent,
  updateSiteContent
};
