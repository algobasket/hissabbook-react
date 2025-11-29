import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === 'development'
    ? "http://localhost:5000"
    : "/backend");

// Helper function to construct absolute URL for backend API calls
function getBackendUrl(path: string, request: NextRequest): string {
  // If API_BASE is already an absolute URL, use it directly
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    return `${API_BASE}${path}`;
  }
  
  // If API_BASE is relative, construct absolute URL from request
  const url = new URL(request.url);
  const protocol = url.protocol;
  const host = url.host;
  
  // Remove leading slash from path if API_BASE already has it
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${protocol}//${host}${API_BASE}${cleanPath}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  try {
    const params = await context.params;
    const { shortCode } = params;

    // Validate short code format (alphanumeric, 6-20 characters)
    if (!/^[a-zA-Z0-9]{6,20}$/.test(shortCode)) {
      return NextResponse.json(
        { message: 'Invalid short code format' },
        { status: 400 }
      );
    }

    // Call backend API to get the original URL
    const backendUrl = getBackendUrl(`/api/s/${shortCode}`, request);
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Short URL not found or has expired', shortCode },
          { status: 404 }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { message: errorData.message || 'Failed to get original URL', shortCode },
          { status: response.status }
        );
      }

      // Parse the response to get the original URL
      const data = await response.json();
      
      if (data.success && data.originalUrl) {
        // Redirect to the original URL
        return NextResponse.redirect(data.originalUrl, 302);
      }

      // If we get here, something unexpected happened
      return NextResponse.json(
        { message: 'Unexpected response from server', data },
        { status: 500 }
      );
    } catch (fetchError) {
      console.error('Error fetching short URL from backend:', fetchError);
      return NextResponse.json(
        { message: 'Failed to resolve short URL', error: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in short URL route:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

