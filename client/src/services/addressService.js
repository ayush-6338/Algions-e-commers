import api from './api.js';

const unwrap = async (request) => (await request).data.data;
export const getAddresses = () => unwrap(api.get('/addresses'));
export const createAddress = (address) => unwrap(api.post('/addresses', address));
export const updateAddress = (id, address) => unwrap(api.put(`/addresses/${id}`, address));
export const deleteAddress = (id) => unwrap(api.delete(`/addresses/${id}`));
export const makeDefaultAddress = (id) => unwrap(api.patch(`/addresses/${id}/default`));
