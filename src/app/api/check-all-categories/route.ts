import { NextResponse } from 'next/server';
import axios from 'axios';

// Proxy para la API de Cecotec
export async function GET() {
  try {
    // Hacemos la petición al servidor Express
    const response = await axios.get('http://localhost:3000/check-all-categories');
    
    // Devolvemos los datos tal cual
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error fetching categories' },
      { status: 500 }
    );
  }
}