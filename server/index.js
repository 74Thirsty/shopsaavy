const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const {
  initializeDb,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSiteContent,
  updateSiteContent
} = require('./lib/db');
const { resolveFromRoot } = require('./lib/paths');

dotenv.config({ path: resolveFromRoot('.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function sanitizeProductInput(body) {
  const requiredFields = ['name', 'price', 'category', 'description'];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    name: String(body.name).trim(),
    price: Number(body.price),
    category: String(body.category).trim(),
    description: String(body.description).trim(),
    image: body.image || '',
    featured: body.featured ? 1 : 0
  };
}

function sanitizeSiteContentInput(body) {
  const requiredFields = [
    'heroBadge',
    'heroTitle',
    'heroDescription',
    'heroPrimaryLabel',
    'heroPrimaryUrl',
    'heroSecondaryLabel',
    'heroSecondaryUrl',
    'heroImage',
    'heroSpotlightEyebrow',
    'heroSpotlightTitle',
    'featuredEyebrow',
    'featuredTitle',
    'featuredDescription',
    'spotlightEyebrow',
    'spotlightTitle',
    'spotlightDescription',
    'spotlightCtaLabel',
    'spotlightCtaUrl'
  ];

  const sanitized = {};
  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined || value === null) {
      throw new Error(`Missing required field: ${field}`);
    }
    sanitized[field] = String(value).trim();
  }
  return sanitized;
}

function requireAdmin(req, res, next) {
  const headerPassword = req.headers['x-admin-password'];
  if (!headerPassword || headerPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    siteName: process.env.SITE_NAME || 'SaavyShop Demo'
  });
});

app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;
    const filters = {
      category: category || undefined,
      minPrice: minPrice && !Number.isNaN(Number(minPrice)) ? Number(minPrice) : undefined,
      maxPrice: maxPrice && !Number.isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined
    };
    const products = await listProducts(filters);
    res.json(products);
  } catch (error) {
    console.error('Failed to list products', error);
    res.status(500).json({ message: 'Failed to load products' });
  }
});

app.get('/api/site-content', async (_req, res) => {
  try {
    const content = await getSiteContent();
    res.json(content);
  } catch (error) {
    console.error('Failed to load site content', error);
    res.status(500).json({ message: 'Failed to load site content' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    console.error('Failed to fetch product', error);
    return res.status(500).json({ message: 'Failed to load product' });
  }
});

app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const productData = sanitizeProductInput(req.body);
    if (Number.isNaN(productData.price)) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }
    const created = await createProduct(productData);
    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create product', error);
    res.status(400).json({ message: error.message || 'Failed to create product' });
  }
});

app.post('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

app.put('/api/site-content', requireAdmin, async (req, res) => {
  try {
    const siteContent = sanitizeSiteContentInput(req.body);
    const updated = await updateSiteContent(siteContent);
    res.json(updated);
  } catch (error) {
    console.error('Failed to update site content', error);
    res.status(400).json({ message: error.message || 'Failed to update site content' });
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const productData = sanitizeProductInput(req.body);
    if (Number.isNaN(productData.price)) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }
    const updated = await updateProduct(req.params.id, productData);
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(updated);
  } catch (error) {
    console.error('Failed to update product', error);
    return res.status(400).json({ message: error.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const removed = await deleteProduct(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete product', error);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
});

const clientBuildPath = resolveFromRoot('client', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.sendFile(resolveFromRoot('client', 'dist', 'index.html'));
});

initializeDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
