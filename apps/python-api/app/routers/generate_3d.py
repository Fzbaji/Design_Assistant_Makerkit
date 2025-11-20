"""
Router pour génération 3D avec TripoSR
Convertit une image en modèle 3D GLB
"""
from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
import io
import base64
import tempfile
import os
import logging
from pathlib import Path
import torch

logger = logging.getLogger(__name__)

router = APIRouter()

# Import TripoSR - on va l'installer si nécessaire
try:
    from PIL import Image
    import numpy as np
except ImportError:
    logger.warning("PIL not installed, image features may not work")

@router.post("/generate-3d")
async def generate_3d(
    image_base64: str = Form(...),
    product_name: str = Form(default="Product"),
):
    """
    Generate 3D model from base64 image using TripoSR
    
    Args:
        image_base64: Base64 encoded image
        product_name: Product name (for logging/naming)
    
    Returns:
        GLB file or error message
    """
    try:
        logger.info(f"🎨 Starting 3D generation for: {product_name}")
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_img:
            tmp_img.write(image_data)
            img_path = tmp_img.name
        
        logger.info(f"📸 Image saved to: {img_path}")
        
        # Import TripoSR
        try:
            from tsr.system import TSR
            from tsr.utils import remove_background, resize_foreground
        except ImportError:
            logger.error("TripoSR not installed - this feature requires: pip install TripoSR")
            return JSONResponse(
                {
                    "success": False,
                    "error": "TripoSR not installed on backend. Install with: pip install git+https://github.com/VAST-AI-Research/TripoSR.git",
                    "isDemoMode": True
                },
                status_code=503
            )
        
        # Load TripoSR model
        logger.info("⏳ Loading TripoSR model...")
        device = "cuda" if os.environ.get("USE_CUDA", "false").lower() == "true" else "cpu"
        model = TSR.from_pretrained(
            "JeffreyXiang/TripoSR",
            cache_dir=".cache/triposr",
            device=device
        )
        logger.info(f"✓ Model loaded on device: {device}")
        
        # Load and preprocess image
        logger.info("🖼️  Processing image...")
        image = Image.open(img_path).convert('RGB')
        
        # Remove background if needed
        image = remove_background(image)
        image = resize_foreground(image, 0.85)
        
        # Generate 3D model
        logger.info("🎯 Generating 3D model...")
        with torch.no_grad():
            scene_codes = model(image, remesh=True, chunk_size=8)
        
        # Export to GLB
        logger.info("💾 Exporting to GLB...")
        output_dir = tempfile.gettempdir()
        output_path = os.path.join(output_dir, f"{product_name.replace(' ', '_')}_model.glb")
        
        model.export(scene_codes, output_path)
        logger.info(f"✓ Model exported to: {output_path}")
        
        # Return GLB file
        return FileResponse(
            output_path,
            media_type="model/gltf-binary",
            filename=f"{product_name}.glb"
        )
        
    except Exception as e:
        logger.error(f"❌ Error generating 3D model: {str(e)}", exc_info=True)
        return JSONResponse(
            {
                "success": False,
                "error": f"3D generation failed: {str(e)}",
                "isDemoMode": True
            },
            status_code=500
        )
    finally:
        # Cleanup
        if 'img_path' in locals() and os.path.exists(img_path):
            os.unlink(img_path)
