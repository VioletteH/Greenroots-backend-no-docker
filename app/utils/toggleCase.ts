export function snakeToCamel<T extends Record<string, any>>(obj: Record<string, any>): T {
    const newObj: Record<string, any> = {};
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[camelKey] = obj[key];
      }
    }
  
    return newObj as T;
  }
  
  
  export function camelToSnake<T extends Record<string, any>>(obj: Record<string, any>): T {
    const newObj: Record<string, any> = {};
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = obj[key];
      }
    }
  
    return newObj as T;
  }