export const taxConfigStorage={
    get(): any {
        if (typeof window === 'undefined') return [];
        // const data = localStorage.getItem(STORAGE_KEY);
        // return data ? JSON.parse(data) : [];
        return [];
      },
}