const getStorageKey = (entity) => `${entity.toLowerCase()}s`;

const loadData = (entity) => {
  const key = getStorageKey(entity);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveData = (entity, data) => {
  const key = getStorageKey(entity);
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Date.now().toString();

const createEntityMethods = (entity) => ({
  filter: async (query = {}) => {
    let data = loadData(entity);
    if (query.where) {
      data = data.filter(item => {
        return Object.entries(query.where).every(([key, value]) => item[key] === value);
      });
    }
    return data;
  },
  get: async (id) => {
    const data = loadData(entity);
    return data.find(item => item.id === id) || null;
  },
  create: async (itemData) => {
    const data = loadData(entity);
    const newItem = { ...itemData, id: generateId() };
    data.push(newItem);
    saveData(entity, data);
    return newItem;
  },
  update: async (id, updates) => {
    const data = loadData(entity);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates };
    saveData(entity, data);
    return data[index];
  },
  delete: async (id) => {
    const data = loadData(entity);
    const filtered = data.filter(item => item.id !== id);
    saveData(entity, filtered);
    return true;
  }
});

export const db = {
  auth: {
    isAuthenticated: async () => {
      // Simple check: if there's a 'user' in localStorage
      return !!localStorage.getItem('user');
    },
    me: async () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  },
  entities: new Proxy({}, {
    get: (target, prop) => createEntityMethods(prop)
  }),
  integrations: {
    Core: {
      UploadFile: async (file) => {
        // Mock upload, return a fake URL
        return { file_url: `http://localhost:3000/uploads/${file.name}` };
      }
    }
  }
};