import { NextRequest, NextResponse } from 'next/server';

// Helper function to get backend URL for server-side requests
function getBackendUrl(path: string, request: NextRequest): string {
  // Check for explicit backend URL (absolute) - highest priority
  const explicitBackend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (explicitBackend && (explicitBackend.startsWith('http://') || explicitBackend.startsWith('https://'))) {
    return `${explicitBackend}${path}`;
  }
  
  // Development: use localhost
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:5000${path}`;
  }
  
  // Production/Docker: Use Docker internal service name
  // When Next.js runs in Docker, it can reach backend via service name 'backend'
  // This is the most reliable way in Docker environments
  if (process.env.NODE_ENV === 'production') {
    // Use Docker internal network (backend service name from docker-compose)
    const dockerBackend = process.env.BACKEND_INTERNAL_URL || 'http://backend:5000';
    return `${dockerBackend}${path}`;
  }
  
  // Fallback: construct from request URL (shouldn't normally reach here)
  const url = new URL(request.url);
  const protocol = url.protocol;
  const host = url.host;
  const apiBase = explicitBackend || '/backend';
  
  return `${protocol}//${host}${apiBase}${path}`;
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
    
    // Log for debugging (remove in production if needed)
    console.log('Short URL resolve - Backend URL:', backendUrl);
    console.log('Short URL resolve - Short code:', shortCode);
    console.log('Short URL resolve - NODE_ENV:', process.env.NODE_ENV);
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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
      console.error('Error fetching short URL from backend:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        backendUrl,
        shortCode,
      });
      
      // More detailed error message
      let errorMessage = 'Failed to resolve short URL';
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout - backend server may be slow or unreachable';
        } else if (fetchError.message.includes('fetch failed')) {
          errorMessage = `Cannot connect to backend server at ${backendUrl}`;
        } else {
          errorMessage = fetchError.message;
        }
      }
      
      return NextResponse.json(
        { 
          message: errorMessage, 
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          backendUrl: process.env.NODE_ENV === 'development' ? backendUrl : undefined, // Only show in dev
        },
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

