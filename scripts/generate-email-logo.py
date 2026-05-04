"""
Generates a 96x96 PNG of the YudBot logo (black rounded square + white chart line)
for use in transactional email templates. Gmail does not render inline SVG, so
we ship this PNG and reference it via URL.
"""
from PIL import Image, ImageDraw
import os

SIZE = 96
RADIUS = 22  # Border radius for the rounded square
BG = (255, 255, 255, 255)  # blanco como en el sidebar
FG = (0, 0, 0, 255)         # negro
BORDER = (0, 0, 0, 30)      # borde sutil para que el cuadrado se vea sobre fondo blanco
BORDER_WIDTH = 2

# Create RGBA image for transparency support, but bg covers all
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Rounded square background con borde sutil
draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=RADIUS, fill=BG, outline=BORDER, width=BORDER_WIDTH)

# Scale the SVG path coordinates from 32x32 viewBox to 96x96
scale = SIZE / 32

points = [
    (5, 22),   # Bottom-left start
    (11, 16),
    (17, 19),
    (23, 11),
    (28, 8),   # Top-right end (where the dot goes)
]
scaled = [(int(x * scale), int(y * scale)) for (x, y) in points]

# Polyline for chart
draw.line(scaled, fill=FG, width=int(2.4 * scale * 0.8), joint="curve")

# Circle at the last point (radius 3 in viewBox = ~9px)
cx, cy = scaled[-1]
r = int(3 * scale)
draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=FG)

# Save
out_path = os.path.join(os.path.dirname(__file__), "..", "logo-email.png")
img.save(out_path, "PNG", optimize=True)
print(f"Saved {out_path}")
