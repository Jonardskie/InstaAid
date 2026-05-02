    import { NextResponse } from 'next/server';

    export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius') || '5000';

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    try {
        const query = `
        [out:json][timeout:25];
        (
            node["amenity"="hospital"](around:${radius},${lat},${lon});
            way["amenity"="hospital"](around:${radius},${lat},${lon});
            relation["amenity"="hospital"](around:${radius},${lat},${lon});
        );
        out center;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: new URLSearchParams({ data: query }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Overpass API error response:', response.status, text);
            return NextResponse.json({ pois: [] }, { status: 502 });
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Overpass API returned non-JSON response:', contentType, text);
            return NextResponse.json({ pois: [] }, { status: 502 });
        }

        const data = await response.json();
        const pois = data.elements.map((el: any) => ({
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            name: el.tags?.name || 'Hospital',
        }));

        return NextResponse.json({ pois });
    } catch (error) {
        console.error('POI API error:', error);
        return NextResponse.json({ pois: [] });
    }
    }