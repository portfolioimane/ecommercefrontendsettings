import React, { useState, useEffect } from 'react';
import axios from '../../../axios'; // Adjust the import based on your axios configuration

const PayPalSettings = () => {
    const [settings, setSettings] = useState({
        clientId: '',
        clientSecret: '',
        mode: 'sandbox', // 'sandbox' or 'live'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/admin/settings/paypal'); // Adjust the API endpoint
                setSettings(response.data);
            } catch (error) {
                console.error('Error fetching PayPal settings:', error);
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
            await axios.post('/api/admin/settings/paypal', settings); // Adjust the API endpoint
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving PayPal settings:', error);
        }
    };

    return (
        <div>
            <h2>PayPal Settings</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Client ID:
                        <input type="text" name="clientId" value={settings.clientId} onChange={handleChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Client Secret:
                        <input type="text" name="clientSecret" value={settings.clientSecret} onChange={handleChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Mode:
                        <select name="mode" value={settings.mode} onChange={handleChange}>
                            <option value="sandbox">Sandbox</option>
                            <option value="live">Live</option>
                        </select>
                    </label>
                </div>
                <button type="submit">Save Settings</button>
            </form>
        </div>
    );
};

export default PayPalSettings;
