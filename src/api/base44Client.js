// Local data store using localStorage
const storage = window.localStorage;

const getEntities = (entityName) => {
  const data = storage.getItem(`entities_${entityName}`);
  return data ? JSON.parse(data) : [];
};

const saveEntities = (entityName, entities) => {
  storage.setItem(`entities_${entityName}`, JSON.stringify(entities));
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const createEntityProxy = (entityName) => ({
  filter: async (query = {}) => {
    const entities = getEntities(entityName);
    return entities.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  },
  list: async (sort = '') => {
    const entities = getEntities(entityName);
    let sorted = [...entities];
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      sorted.sort((a, b) => {
        if (a[field] < b[field]) return desc ? 1 : -1;
        if (a[field] > b[field]) return desc ? -1 : 1;
        return 0;
      });
    }
    return sorted;
  },
  get: async (id) => {
    const entities = getEntities(entityName);
    return entities.find(item => item.id === id) || null;
  },
  create: async (data) => {
    const entities = getEntities(entityName);
    const newItem = { ...data, id: data.id || generateId() };
    entities.push(newItem);
    saveEntities(entityName, entities);
    return newItem;
  },
  update: async (id, data) => {
    const entities = getEntities(entityName);
    const index = entities.findIndex(item => item.id === id);
    if (index !== -1) {
      entities[index] = { ...entities[index], ...data };
      saveEntities(entityName, entities);
      return entities[index];
    }
    return null;
  },
  delete: async (id) => {
    const entities = getEntities(entityName);
    const filtered = entities.filter(item => item.id !== id);
    saveEntities(entityName, filtered);
    return true;
  }
});

const entitiesProxy = new Proxy({}, {
  get: (target, prop) => createEntityProxy(prop)
});

const auth = {
  isAuthenticated: async () => {
    const user = storage.getItem('current_user');
    return !!user;
  },
  me: async () => {
    const user = storage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  },
  login: async (credentials) => {
    // Simple mock login
    const user = { id: '1', name: 'Admin', email: 'admin@example.com' };
    storage.setItem('current_user', JSON.stringify(user));
    return user;
  },
  logout: async (redirectUrl) => {
    storage.removeItem('current_user');
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  redirectToLogin: async (redirectUrl) => {
    // Mock, just login
    await auth.login();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }
};

const integrations = {
  Core: {
    UploadFile: async (file) => {
      // Mock upload, return a fake URL
      return { file_url: `local://${file.name}` };
    }
  }
};

export const db = { auth, entities: entitiesProxy, integrations };
export const base44 = db;
export default db;