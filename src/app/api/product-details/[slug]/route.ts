// src/app/api/product-details/[slug]/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  
  // Obtener la URL actual para verificar si hay parámetros de consulta
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === 'true';
  
  try {
    console.log(`API Route: Fetching product ${slug}`);
    const apiUrl = force
      ? `http://localhost:3000/product-details/${slug}?force=true`
      : `http://localhost:3000/product-details/${slug}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 60000 // Aumentar el timeout a 60 segundos
    });
    
    console.log(`API Route: Successfully fetched product ${slug}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`API Route: Error fetching product ${slug}:`, error);
    
    // Devolver un objeto de error formateado
    const formattedProductName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return NextResponse.json(
      { 
        error: true,
        message: error instanceof Error ? error.message : 'Error desconocido',
        slug,
        name: formattedProductName
      },
      { status: 200 } // Devolver 200 para que el frontend pueda manejarlo
    );
  }
}