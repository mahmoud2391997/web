#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create a simple icon
size = 512
img = Image.new('RGBA', (size, size), (30, 58, 138, 255))  # Blue background
draw = ImageDraw.Draw(img)

# Draw a simple "Z14" text
try:
    # Try to use a system font
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 200)
except:
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 200)
    except:
        font = ImageFont.load_default()

# Draw text
text = "Z14"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (size - text_width) // 2
y = (size - text_height) // 2

draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)

# Save the icon
img.save('build/icon.png')
print("Icon created successfully!")
