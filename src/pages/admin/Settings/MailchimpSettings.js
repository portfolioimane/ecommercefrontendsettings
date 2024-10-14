import React, { useState, useEffect } from 'react';
import axios from '../../../axios'; // Adjust the import based on your axios configuration

const MailchimpSettings = () => {
    const [settings, setSettings] = useState({
        apiKey: '',
        listId: '',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/admin/settings/mailchimp'); // Adjust the API endpoint
                setSettings(response.data);
            } catch (error) {
                console.error('Error fetching Mailchimp settings:', error);
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
            await axios.post('/api/admin/settings/mailchimp', settings); // Adjust the API endpoint
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving Mailchimp settings:', error);
        }
    };

    return (
        <div>
            <h2>Mailchimp Settings</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        API Key:
                        <input type="text" name="apiKey" value={settings.apiKey} onChange={handleChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        List ID:
                        <input type="text" name="listId" value={settings.listId} onChange={handleChange} required />
                    </label>
                </div>
                <button type="submit">Save Settings</button>
            </form>
        </div>
    );
};

export default MailchimpSettings;
