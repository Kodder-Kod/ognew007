'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MpesaPaymentPage() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [callbackData, setCallbackData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setCallbackData(null);
        setLoading(true);

        try {
            await axios.post('/api/mpesa', { phoneNumber, amount });
            setMessage("STK Push sent. Enter PIN on your phone!");
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Payment failed.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Poll callback data every 3 seconds
useEffect(() => {
    if (callbackData) return; // stop polling after callback

    let isMounted = true;

    const interval = setInterval(async () => {
        try {
            const res = await axios.get("/api/mpesa_callback");
            const newData = res.data?.lastMpesaResult;

            if (isMounted && newData) {
                setCallbackData(newData);
                clearInterval(interval); // stop polling
            }
        } catch (err) {
            console.log("polling error", err);
        }
    }, 3000);

    return () => { isMounted = false; clearInterval(interval); };
}, [callbackData]);


    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-green-700">
                    M-Pesa STK Push Payment 📱
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* PHONE INPUT */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone Number (2547...)
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                            placeholder="2547..."
                        />
                    </div>

                    {/* AMOUNT INPUT */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Amount (KES)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                            placeholder="Amount"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 text-white bg-green-600 rounded-md"
                    >
                        {loading ? 'Processing...' : 'Pay with M-Pesa'}
                    </button>
                </form>

                {message && <p className="mt-4 text-green-600">{message}</p>}
                {error && <p className="mt-4 text-red-600">{error}</p>}

                {/* RESULT UI */}
                {callbackData && (
                    <div className="mt-6 border p-4 rounded bg-gray-50">
                        <h3 className="font-bold mb-2">
                            {callbackData.Body.stkCallback.ResultCode === 0
                                ? "✅ Payment Successful!"
                                : "❌ Payment Failed"}
                        </h3>

                        <p><b>Amount:</b> {
                            callbackData.Body.stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "Amount")?.Value
                        }</p>

                        <p><b>Mpesa Code:</b> {
                            callbackData.Body.stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "MpesaReceiptNumber")?.Value
                        }</p>

                        <p><b>Phone:</b> {
                            callbackData.Body.stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "PhoneNumber")?.Value
                        }</p>

                        <p><b>Name:</b> {
                            callbackData.Body.stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "Balance")?.Value
                        }</p>
                    </div>
                )}
            </div>
        </main>
    );
}
