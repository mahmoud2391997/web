#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a new image with a dark background
    img = Image.new('RGB', (size, size), color=(30, 41, 59))  # Dark blue background
    draw = ImageDraw.Draw(img)
    
    # Add text
    try:
        # Try to use a larger font for better readability
        font_size = max(8, size // 12)
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Calculate text position
    text = "PS"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw text
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    # Save the image
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

# Create the icons
create_icon(192, "/Users/mahmoudelsayed/Downloads/sam-s-ps-game-center/public/icon-192.png")
create_icon(512, "/Users/mahmoudelsayed/Downloads/sam-s-ps-game-center/public/icon-512.png")

print("PWA icons created successfully!")
