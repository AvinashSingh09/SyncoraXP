export const getBagStorageKey = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userObj = JSON.parse(storedUser);
            const userKey = userObj?.email || userObj?.id || userObj?._id;
            if (userKey) {
                return `my_bag_${userKey.toString().toLowerCase().trim()}`;
            }
        }
    } catch (e) {
        console.error('Failed to resolve user bag storage key:', e);
    }
    return 'my_bag';
};

export const getUserBagItems = () => {
    try {
        const key = getBagStorageKey();
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
};

export const setUserBagItems = (items) => {
    try {
        const key = getBagStorageKey();
        localStorage.setItem(key, JSON.stringify(items));
        window.dispatchEvent(new Event('storage'));
    } catch (e) {
        console.error('Failed to set user bag items:', e);
    }
};
