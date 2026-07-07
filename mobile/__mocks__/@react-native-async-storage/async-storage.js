const mockData = {};

const mockAsyncStorage = {
  getItem: jest.fn(async (key) => mockData[key] ?? null),
  setItem: jest.fn(async (key, value) => {
    mockData[key] = value;
  }),
  removeItem: jest.fn(async (key) => {
    delete mockData[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(mockData).forEach((key) => delete mockData[key]);
  }),
};

export default mockAsyncStorage;
