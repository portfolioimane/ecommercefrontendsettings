import React, { useState, useEffect } from 'react';
import axios from '../../../axios'; // Adjust the import based on your axios configuration

const PusherSettings = () => {
    const [settings, setSettings] = useState({
        enabled: false,
        apiKey: '',
        apiSecret: '',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/admin/settings/push'); // Adjust the API endpoint
                setSettings(response.data);
            } catch (error) {
                console.error('Error fetching push settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/settings/push', settings); // Adjust the API endpoint
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving push settings:', error);
        }
    };

    return (
        <div>
            <h2>Push Notification Settings</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            name="enabled"
                            checked={settings.enabled}
                            onChange={(e) => handleChange({ target: { name: 'enabled', value: e.target.checked } })}
                        />
                        Enable Push Notifications
                    </label>
                </div>
                <div>
                    <label>
                        API Key:
                        <input type="text" name="apiKey" value={settings.apiKey} onChange={handleChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        API Secret:
                        <input type="text" name="apiSecret" value={settings.apiSecret} onChange={handleChange} required />
                    </label>
                </div>
                <button type="submit">Save Settings</button>
            </form>
        </div>
    );
};

export default PusherSettings;
