"""
Genera 2 PNGs (blanco y negro) del logo oficial de YudBot a partir de los SVG.
- logo-white.png  → fondo blanco con trazo oscuro (para fondos oscuros)
- logo-black.png  → fondo oscuro con trazo blanco (para fondos claros, ej. emails)

Gmail no renderiza inline SVG, así que los emails usan el PNG.
"""
from PIL import Image, ImageDraw
import os

SIZE = 96
RADIUS_PX = SIZE * (56 / 256)  # 56/256 viewBox proportion ≈ 21px
LINE_WIDTH = max(2, round(SIZE * (14 / 256)))

# Path en viewBox 256: (56,168) -> (102,118) -> (142,148) -> (192,82)
# Escalado a SIZE
def scale_pt(p):
    s = SIZE / 256
    return (int(p[0] * s), int(p[1] * s))

POINTS = [scale_pt((56,168)), scale_pt((102,118)), scale_pt((142,148)), scale_pt((192,82))]
DOT_CENTER = scale_pt((192, 82))
DOT_RADIUS = max(2, round(SIZE * (16 / 256)))

# Padding (la rect del SVG empieza en 16,16 sobre 256, así que el padding es 16/256 ≈ 6.25%)
PAD = round(SIZE * (16 / 256))


def render(bg, fg, out_path):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Cuadrado redondeado
    draw.rounded_rectangle(
        (PAD, PAD, SIZE - PAD - 1, SIZE - PAD - 1),
        radius=int(RADIUS_PX),
        fill=bg,
    )
    # Linea
    draw.line(POINTS, fill=fg, width=LINE_WIDTH, joint="curve")
    # Punto
    cx, cy = DOT_CENTER
    draw.ellipse((cx - DOT_RADIUS, cy - DOT_RADIUS, cx + DOT_RADIUS, cy + DOT_RADIUS), fill=fg)

    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path}")


root = os.path.join(os.path.dirname(__file__), "..")
render(bg=(255, 255, 255, 255), fg=(17, 17, 17, 255), out_path=os.path.join(root, "logo-white.png"))
render(bg=(17, 17, 17, 255), fg=(255, 255, 255, 255), out_path=os.path.join(root, "logo-black.png"))
# Alias por compatibilidad con plantillas viejas
import shutil
shutil.copy(os.path.join(root, "logo-black.png"), os.path.join(root, "logo-email.png"))

# Iconos de PWA / favicon — usamos el negro (visible en todas las pestañas/sistemas)
def render_icon(size, out_path):
    global SIZE, RADIUS_PX, LINE_WIDTH, POINTS, DOT_CENTER, DOT_RADIUS, PAD
    prev_size = SIZE
    SIZE = size
    RADIUS_PX = SIZE * (56 / 256)
    LINE_WIDTH = max(2, round(SIZE * (14 / 256)))
    def s(p):
        sc = SIZE / 256
        return (int(p[0] * sc), int(p[1] * sc))
    POINTS = [s((56,168)), s((102,118)), s((142,148)), s((192,82))]
    DOT_CENTER = s((192, 82))
    DOT_RADIUS = max(2, round(SIZE * (16 / 256)))
    PAD = round(SIZE * (16 / 256))
    render(bg=(17, 17, 17, 255), fg=(255, 255, 255, 255), out_path=out_path)
    SIZE = prev_size

render_icon(192, os.path.join(root, "icon-192.png"))
render_icon(512, os.path.join(root, "icon-512.png"))
print("Iconos PWA actualizados (icon-192.png, icon-512.png)")
