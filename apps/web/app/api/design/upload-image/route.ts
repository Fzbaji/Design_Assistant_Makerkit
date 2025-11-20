import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Upload an image to Supabase and return the public URL
 * Used to convert base64 images to URLs for third-party APIs (e.g., Replicate)
 */
export async function POST(request: NextRequest) {
  try {
    const { imageBase64, fileName } = await request.json();

    if (!imageBase64 || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64 or fileName' },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading image: ${fileName}`);

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique file path in Supabase
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filePath = `design-assistant/3d-models/${timestamp}-${randomId}-${fileName}`;

    console.log(`🔑 File path: ${filePath}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('account_image')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    console.log(`✓ Uploaded to Supabase:`, data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('account_image').getPublicUrl(filePath);

    console.log(`🌐 Public URL: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      publicUrl: publicUrl,
      filePath: filePath,
    });
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image to Supabase',
      },
      { status: 500 }
    );
  }
}
