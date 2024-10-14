// src/components/StripeSettings.js
import React, { useEffect, useState } from 'react';
import axios from '../../../axios';

const StripeSettings = () => {
    const [settings, setSettings] = useState({ key: '', secret: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/admin/settings/stripe');
                setSettings(response.data);
            } catch (err) {
                setError('Error fetching Stripe settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/settings/stripe', settings);
            alert('Stripe settings updated successfully!');
        } catch (err) {
            setError('Error updating Stripe settings');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Stripe Settings</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Stripe Key:</label>
                    <input
                        type="text"
                        name="key"
                        value={settings.key}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Stripe Secret:</label>
                    <input
                        type="text"
                        name="secret"
                        value={settings.secret}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Save Settings</button>
            </form>
        </div>
    );
};

export default StripeSettings;
