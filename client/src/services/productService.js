import api from './api.js';

export async function getProducts(params) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data.data;
}

export async function getProduct(slug) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`);
  return data.data;
}

export async function getFeatured(limit = 8) {
  const response = await getProducts({ featured: true, limit });
  return response.data;
}

export async function getNewArrivals(limit = 4) {
  const response = await getProducts({ sort: 'newest', limit });
  return response.data;
}

export async function getBestSellers(limit = 4) {
  const response = await getProducts({ sort: 'bestselling', limit });
  return response.data;
}

export async function getByIds(ids) {
  if (!ids.length) return [];
  const { data } = await api.get('/products/by-ids', { params: { ids: ids.join(',') } });
  return data.data;
}
