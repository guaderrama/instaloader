import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy for downloading Instagram media
// This bypasses CORS issues entirely by fetching from our server

const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mediaUrl = searchParams.get('url')

  if (!mediaUrl) {
    return NextResponse.json(
      { error: 'URL is required' },
      { status: 400 }
    )
  }

  // Validate URL is from Instagram CDN
  if (!mediaUrl.includes('cdninstagram.com') && !mediaUrl.includes('fbcdn.net')) {
    return NextResponse.json(
      { error: 'Invalid URL - only Instagram media URLs allowed' },
      { status: 400 }
    )
  }

  try {
    const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

    console.log('[PROXY] Fetching:', mediaUrl.substring(0, 80) + '...')

    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': randomUA,
        'Accept': 'image/*, video/*, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com',
      },
    })

    if (!response.ok) {
      console.log('[PROXY] Failed with status:', response.status)
      return NextResponse.json(
        { error: `Failed to fetch media: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()

    console.log('[PROXY] Success, size:', buffer.byteLength, 'type:', contentType)

    // Return the media with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('[PROXY] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
