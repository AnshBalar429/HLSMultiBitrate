import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;

    const blobUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${path.join('/')}`;
    const azureResponse = await fetch(blobUrl);

    if (!azureResponse.ok) {
      return new NextResponse('Failed to fetch blob', { status: azureResponse.status });
    }

    const data = await azureResponse.arrayBuffer();
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': azureResponse.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}
    