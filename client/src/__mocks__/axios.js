// Jest manual mock for axios to resolve ESM import incompatibility in Create React App
const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(() => mockAxios),
  defaults: { adapter: {}, headers: { common: {} } },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

module.exports = mockAxios;
