import axios from 'axios';
import { API_BASE } from '../config';

const API_URL = API_BASE;

export const loadSystemConfig = async () => {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.warn('⚠️ No token found, loading public config instead.');
            return await loadPublicConfig();
        }
        
        const response = await axios.get(`${API_URL}/system/config`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        localStorage.setItem('systemConfig', JSON.stringify(response.data));
        return response.data;
    } catch (err) {
        console.error('❌ Error loading system config:', err);
        
        if (err.response?.status === 401) {
            console.error('🔒 Session expired. Redirecting to public access.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return await loadPublicConfig();
        }
        return null;
    }
};

export const loadPublicConfig = async () => {
    try {
        const response = await axios.get(`${API_URL}/system/public-config`, {
            params: { _ts: Date.now() },
            headers: { 'Cache-Control': 'no-cache' }
        });
        localStorage.setItem('publicConfig', JSON.stringify(response.data));
        console.log('✅ Public config loaded successfully');
        return response.data;
    } catch (err) {
        console.error('❌ Error loading public config:', err);
        
        const defaultConfig = {
            appointment: {
                maxAppointmentsPerDay: 20,
                availableTimeSlots: [
                    '9.00 AM - 10.00 AM', '10.00 AM - 11.00 AM', '11.00 AM - 12.00 PM',
                    '1.00 PM - 2.00 PM', '2.00 PM - 3.00 PM'
                ],
                advanceBookingDays: 14
            },
            welfare: { incomeVerificationRequired: true },
            general: { officeHours: '8.30 AM - 4.15 PM' }
        };
        localStorage.setItem('publicConfig', JSON.stringify(defaultConfig));
        return defaultConfig;
    }
};

export const updateSystemConfig = async (configData) => {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('ඔබේ සැසිය (Session) අවසන් වී ඇත. කරුණාකර නැවත Login වන්න.');
            throw new Error('Authentication token is missing. Please login again.');
        }

        const response = await axios.put(`${API_URL}/system/config`, configData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            }
        });
        
        const updatedData = response.data.config || response.data;
        localStorage.setItem('systemConfig', JSON.stringify(updatedData));
        // Ensure public config consumers reflect changes immediately
        if (updatedData?.general) {
            const prevPublic = getPublicConfig() || {};
            const nextPublic = { ...prevPublic, ...updatedData, general: updatedData.general };
            localStorage.setItem('publicConfig', JSON.stringify(nextPublic));
        }
        // Notify running app to refresh config-dependent UI
        window.dispatchEvent(new Event('villageflow:config-updated'));
        console.log('✅ System settings updated successfully');
        return response.data;
    } catch (err) {
        console.error('❌ Error updating config:', err);
        if (err.response?.status === 401) {
            alert('ඔබගේ Session එක අවසන් වී ඇත. කරුණාකර නැවත Login වන්න.');
        }
        throw err;
    }
};

export const resetSystemConfig = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/system/config/reset`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const resetData = response.data.config || response.data;
        localStorage.setItem('systemConfig', JSON.stringify(resetData));
        if (resetData?.general) {
            const prevPublic = getPublicConfig() || {};
            const nextPublic = { ...prevPublic, ...resetData, general: resetData.general };
            localStorage.setItem('publicConfig', JSON.stringify(nextPublic));
        }
        window.dispatchEvent(new Event('villageflow:config-updated'));
        return response.data;
    } catch (err) {
        console.error('❌ Error resetting config:', err);
        throw err;
    }
};

export const getConfig = () => {
    const config = localStorage.getItem('systemConfig');
    return config ? JSON.parse(config) : null;
};

export const getPublicConfig = () => {
    const config = localStorage.getItem('publicConfig');
    return config ? JSON.parse(config) : null;
};

export const validateToken = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        await axios.get(`${API_URL}/system/check`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return true;
    } catch (err) {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return false;
    }
};

export const loadAppointmentSettings = async () => {
    try {
        const response = await axios.get(`${API_URL}/appointments/available-slots`);
        return response.data;
    } catch (err) { return null; }
};

export const loadWelfareSettings = async () => {
    try {
        const response = await axios.get(`${API_URL}/welfare/settings`);
        return response.data;
    } catch (err) { return null; }
};

export const getAdvanceDays = async () => {
    try {
        const response = await axios.get(`${API_URL}/appointments/advance-days`);
        return response.data.advanceDays;
    } catch (err) { return 14; }
};
