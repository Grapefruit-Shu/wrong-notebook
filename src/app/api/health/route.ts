import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:health');

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Simple health check - just return OK
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error }, 'Health check failed');
        return NextResponse.json(
            { status: 'error', error: 'Health check failed' },
            { status: 503 }
        );
    }
}
