"""
Genera la imagen de portada (cover) para el producto en Gumroad.
1280×720 PNG, fondo negro, logo + título + tagline + precio.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1280, 720
BG = (10, 10, 10, 255)
FG = (255, 255, 255, 255)
GRID_COLOR = (255, 255, 255, 22)  # blanco translúcido sutil
DIM = (140, 140, 140, 255)
DIM2 = (95, 95, 95, 255)

img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)

# ───── Grid sutil de fondo (capa transparente para que no se mezcle) ─────
grid_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid_layer)
GRID = 64
for x in range(0, W, GRID):
    gd.line([(x, 0), (x, H)], fill=GRID_COLOR, width=1)
for y in range(0, H, GRID):
    gd.line([(0, y), (W, y)], fill=GRID_COLOR, width=1)
img = Image.alpha_composite(img, grid_layer)
draw = ImageDraw.Draw(img)

# ───── Tipografías ─────
def load_font(size, bold=False):
    candidates = []
    if bold:
        candidates += [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
        ]
    else:
        candidates += [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibri.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

font_brand = load_font(46, bold=True)
font_title = load_font(108, bold=True)
font_sub = load_font(30)
font_features = load_font(24, bold=True)
font_price_label = load_font(18, bold=True)
font_price = load_font(80, bold=True)
font_pricesub = load_font(16)
font_footer = load_font(20, bold=True)

# ───── Logo (cuadrado blanco con línea negra, esquina superior izquierda) ─────
LOGO_SIZE = 84
LOGO_X, LOGO_Y = 80, 70
LOGO_RADIUS = int(LOGO_SIZE * (56 / 256))
draw.rounded_rectangle(
    (LOGO_X, LOGO_Y, LOGO_X + LOGO_SIZE, LOGO_Y + LOGO_SIZE),
    radius=LOGO_RADIUS,
    fill=FG,
)
def lp(p):
    s = LOGO_SIZE / 256
    return (int(LOGO_X + p[0] * s), int(LOGO_Y + p[1] * s))

points = [lp((56, 168)), lp((102, 118)), lp((142, 148)), lp((192, 82))]
draw.line(points, fill=(17, 17, 17, 255), width=4, joint="curve")
cx, cy = lp((192, 82))
r = int(LOGO_SIZE * (16 / 256))
draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(17, 17, 17, 255))

# ───── Marca "YudBot" al lado del logo ─────
brand_x = LOGO_X + LOGO_SIZE + 22
brand_y = LOGO_Y + (LOGO_SIZE // 2) - 28
draw.text((brand_x, brand_y), "YudBot", fill=FG, font=font_brand)

# ───── Precio (esquina superior derecha) ─────
price_box_w, price_box_h = 240, 170
px = W - price_box_w - 70
py = 70
draw.rounded_rectangle(
    (px, py, px + price_box_w, py + price_box_h),
    radius=18,
    fill=FG,
)
# Label superior
label = "PAGO ÚNICO"
ll = draw.textlength(label, font=font_price_label)
draw.text((px + (price_box_w - ll) / 2, py + 22), label, fill=(95, 95, 95, 255), font=font_price_label)
# Precio grande centrado
amount = "€9.99"
al = draw.textlength(amount, font=font_price)
draw.text((px + (price_box_w - al) / 2, py + 52), amount, fill=(17, 17, 17, 255), font=font_price)
# Sublabel inferior
sublabel = "Sin suscripciones"
sl = draw.textlength(sublabel, font=font_pricesub)
draw.text((px + (price_box_w - sl) / 2, py + price_box_h - 32), sublabel, fill=(120, 120, 120, 255), font=font_pricesub)

# ───── Título grande ─────
title_y = 240
draw.text((80, title_y), "Bots de trading", fill=FG, font=font_title)
draw.text((80, title_y + 115), "sin código.", fill=DIM, font=font_title)

# ───── Subtítulo ─────
sub_y = title_y + 250
draw.text((80, sub_y), "Crea tu Expert Advisor para MetaTrader 4 y 5 en", fill=DIM, font=font_sub)
draw.text((80, sub_y + 42), "5 minutos con un wizard guiado.", fill=DIM, font=font_sub)

# ───── Features en una sola línea separadas por bullets ─────
features_text = "10 estrategias  ·  24 indicadores  ·  12 prop firms  ·  Filtro de noticias"
fy = sub_y + 110
draw.text((80, fy), features_text, fill=FG, font=font_features)

# ───── Footer dominio (esquina inferior derecha) ─────
domain = "yudbot.com"
dl = draw.textlength(domain, font=font_footer)
draw.text((W - dl - 80, H - 50), domain, fill=DIM2, font=font_footer)

# Guardar
out = os.path.join(os.path.dirname(__file__), "..", "gumroad-cover.png")
img.convert("RGB").save(out, "PNG", optimize=True)
print(f"Saved {out}")
