import os
from PIL import Image

def generate_icons():
    logo_path = 'public/logo.png'
    electron_dir = 'electron'
    os.makedirs(electron_dir, exist_ok=True)

    img = Image.open(logo_path).convert('RGBA')
    bg_color = (14, 20, 32, 255) # Sleek dark slate #0e1420 matching Damena brand

    # Create 512x512 square icon canvas
    size = 512
    canvas = Image.new('RGBA', (size, size), bg_color)

    # Scale logo to fit nicely with breathing room (e.g. 450px wide)
    target_w = 440
    aspect = img.height / img.width
    target_h = int(target_w * aspect)

    resized_logo = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Center on canvas
    x_offset = (size - target_w) // 2
    y_offset = (size - target_h) // 2
    canvas.paste(resized_logo, (x_offset, y_offset), resized_logo)

    # Save 512x512 PNG
    png_path = os.path.join(electron_dir, 'icon.png')
    canvas.save(png_path, format='PNG')
    print(f"Saved {png_path} ({size}x{size})")

    # Save Windows multi-resolution ICO (256, 128, 64, 48, 32, 16)
    ico_path = os.path.join(electron_dir, 'icon.ico')
    canvas.save(
        ico_path,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print(f"Saved {ico_path} (multi-res ICO)")

if __name__ == '__main__':
    generate_icons()
