    let lastMpesaResult = null;

    export async function POST(request) {
        try {
            const callbackData = await request.json();
            console.log("M-Pesa Callback:", callbackData);

            lastMpesaResult = callbackData; // save for frontend polling

            return Response.json(
                { ResultCode: 0, ResultDesc: "Callback received" },
                { status: 200 }
            );
        } catch (error) {
            console.error("Callback error:", error);
            return Response.json(
                { ResultCode: 0, ResultDesc: "Callback stored" },
                { status: 200 }
            );
        }
    }

    // FRONTEND USES THIS ENDPOINT
    export async function GET() {
        return Response.json({ lastMpesaResult });
    }
