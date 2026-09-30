import axios from 'axios';

// --- M-PESA CONFIGURATION ---
// IMPORTANT: Replace these with your actual credentials and ensure they are secure
const CONSUMER_KEY = "ByDOp2ol2mr5O6BDkhSsFq8DjCz5JI9mWQ2jN7j48Fw2GqMT";
const CONSUMER_SECRET = "39Abceg0ze8m6Gx0bvq9FJ8s2WS9L2vPrAfs5oF6ubahrjvjSk85WGbnJEqXCDLG";
const SHORT_CODE = "174379"; // Paybill or Till Number (Sandbox: 174379)
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; // STK Push Passkey
const BIZ_TYPE = "CustomerPayBillOnline"; // "CustomerBuyGoodsOnline" for Tills
const CALLBACK_URL = "https://pseudocentric-greathearted-roberto.ngrok-free.dev/api/mpesa_callback"; // ✅ Correct
const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";


// --- Utility Functions ---

/**
 * Formats a phone number to the 2547... format.
 * @param {string} phone
 * @returns {string | null}
 */
const formatPhoneNumber = (phone) => {
    const trimmedPhone = String(phone).trim();
    if (/^0\d{9}$/.test(trimmedPhone)) { // 07...
        return "254" + trimmedPhone.substring(1);
    } else if (/^\+254\d{9}$/.test(trimmedPhone)) { // +2547...
        return trimmedPhone.substring(1);
    } else if (/^254\d{9}$/.test(trimmedPhone)) { // 2547...
        return trimmedPhone;
    }
    return null;
};

/**
 * Gets the M-Pesa Access Token.
 * @param {string} consumerKey
 * @param {string} consumerSecret
 * @returns {Promise<string | null>}
 */
const getMpesaAccessToken = async (consumerKey, consumerSecret) => {
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });
        return response.data.access_token || null;
    } catch (error) {
        console.error("Access Token Error:", error.response?.data || error.message);
        return null;
    }
};


/**
 * Sends the STK Push request.
 * @param {object} data
 * @param {string} accessToken
 * @returns {Promise<object>}
 */
const sendStkPush = async (data, accessToken) => {
    const url = `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`;

    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error("STK Push Error:", error.response?.data || error.message);
        return { error: 'STK Push failed', details: error.response?.data || error.message };
    }
};

// --- Next.js API Handler (POST) ---

/**
 * Handles the M-Pesa STK Push request.
 */
export async function POST(request) {
    const { phoneNumber, total } = await request.json();


    const totalPrice = parseInt(total, 10);
    const phone = formatPhoneNumber(phoneNumber);


    // 1. Validate Input
    if (!phone || isNaN(totalPrice) || totalPrice <= 0) {
        return Response.json({ message: `Invalid phone number or amount. ${phoneNumber} ${totalPrice}`, }, { status: 400 });
    }

    // 2. Get Access Token
    const accessToken = await getMpesaAccessToken(CONSUMER_KEY, CONSUMER_SECRET);
    console.log("key",CONSUMER_KEY)
    console.log("secret",CONSUMER_SECRET)
    if (!accessToken) {
        return Response.json({ message: "Failed to obtain access token." }, { status: 500 });
    }

    // 3. Prepare STK Push Payload
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${SHORT_CODE}${PASSKEY}${timestamp}`).toString('base64');

    const requestData = {
        BusinessShortCode: SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: BIZ_TYPE,
        Amount: totalPrice,
        PartyA: phone,
        PartyB: SHORT_CODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: "NextJSPayment", // Customizable
        TransactionDesc: "Payment for services" // Customizable
    };

    // 4. Send STK Push
    const stkResponse = await sendStkPush(requestData, accessToken);

    // 5. Respond to Client
    if (stkResponse.ResponseCode === '0') {
        return Response.json({ message: "STK Push initiated successfully!", response: stkResponse }, { status: 200 });
    } else {
        return Response.json({ message: "STK Push failed to initiate.", response: stkResponse }, { status: 500 });
    }
}