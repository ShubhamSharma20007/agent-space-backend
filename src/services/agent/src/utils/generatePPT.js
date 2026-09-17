import pptxgen from 'pptxgenjs'

const COLORS = {
    background: '0F172A',    // deep navy
    backgroundSoft: '1E293B',
    accent: '3B82F6',        // blue
    accentDeep: '2563EB',
    accentSoft: '60A5FA',
    accentPale: 'BFDBFE',
    title: 'FFFFFF',
    subtitle: 'CBD5E1',
    slideBg: 'FFFFFF',
    slideTitle: '0F172A',
    eyebrow: '2563EB',
    bullet: '334155',
    bulletMarker: '3B82F6',
    watermark: 'EFF3FB',
    footer: '94A3B8',
    divider: 'E2E8F0',
}

const PAGE_W = 13.33
const PAGE_H = 7.5

export const generatePPT = async (data) => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    pres.title = data.title
    pres.author = 'Agent Space'
    pres.subject = data.title
    pres.company = 'Agent Space'
    pres.theme = {
        headFontFace: 'Aptos',
        bodyFontFace: 'Aptos',
    }

    const slides = Array.isArray(data.slides) ? data.slides : []
    const totalContentSlides = slides.length

    // =========================================================
    // 1. Cover slide
    // =========================================================
    const cover = pres.addSlide()
    cover.background = { color: COLORS.background }

    // large soft circle top-right for depth
    cover.addShape(pres.ShapeType.ellipse, {
        x: PAGE_W - 5.5, y: -3, w: 9, h: 9,
        fill: { color: COLORS.backgroundSoft },
        line: { type: 'none' },
    })
    cover.addShape(pres.ShapeType.ellipse, {
        x: PAGE_W - 3.2, y: -1.2, w: 5, h: 5,
        fill: { color: COLORS.accentDeep, transparency: 80 },
        line: { type: 'none' },
    })

    // left accent bar
    cover.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: 0.12, h: '100%',
        fill: { color: COLORS.accent },
        line: { type: 'none' },
    })

    // eyebrow label
    cover.addShape(pres.ShapeType.rect, {
        x: 0.8, y: 1.75, w: 0.5, h: 0.05,
        fill: { color: COLORS.accent },
        line: { type: 'none' },
    })
    cover.addText('P R E S E N T A T I O N', {
        x: 0.8, y: 1.85, w: 8, h: 0.4,
        fontFace: 'Aptos',
        fontSize: 12,
        color: COLORS.accentSoft,
        bold: true,
        align: 'left',
    })

    cover.addText(data.title ?? '', {
        x: 0.8, y: 2.35, w: 10.5, h: 1.8,
        fontFace: 'Aptos',
        fontSize: 44,
        bold: true,
        color: COLORS.title,
        align: 'left',
        valign: 'top',
    })

    if (data.subtitle) {
        cover.addText(data.subtitle, {
            x: 0.8, y: 4.05, w: 9.5, h: 0.7,
            fontFace: 'Aptos',
            fontSize: 17,
            color: COLORS.subtitle,
            align: 'left',
        })
    }

    // bottom divider + brand row
    cover.addShape(pres.ShapeType.line, {
        x: 0.8, y: 6.6, w: 3, h: 0,
        line: { color: COLORS.accent, width: 1.5 },
    })
    cover.addText('Agent Space', {
        x: 0.8, y: 6.7, w: 6, h: 0.4,
        fontFace: 'Aptos',
        fontSize: 12,
        color: COLORS.accentPale,
        align: 'left',
    })
    cover.addText(`${totalContentSlides} Sections`, {
        x: PAGE_W - 2.8, y: 6.7, w: 2, h: 0.4,
        fontFace: 'Aptos',
        fontSize: 12,
        color: COLORS.accentPale,
        align: 'right',
    })

    // =========================================================
    // 2. Content slides
    // =========================================================
    slides.forEach((slide, i) => {
        const s = pres.addSlide()
        s.background = { color: COLORS.slideBg }

        const num = String(i + 1).padStart(2, '0')

        // giant faint watermark number behind the heading
        s.addText(num, {
            x: PAGE_W - 3.6, y: -0.6, w: 3.4, h: 2.6,
            fontFace: 'Aptos',
            fontSize: 140,
            bold: true,
            color: COLORS.watermark,
            align: 'right',
        })

        // top accent bar
        s.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: 0.1,
            fill: { color: COLORS.accent },
            line: { type: 'none' },
        })

        // eyebrow: "SECTION 0X"
        s.addText(`SECTION ${num}`, {
            x: 0.6, y: 0.45, w: 5, h: 0.35,
            fontFace: 'Aptos',
            fontSize: 12,
            bold: true,
            color: COLORS.eyebrow,
            charSpacing: 2,
            align: 'left',
        })

        s.addText(slide.title ?? '', {
            x: 0.6, y: 0.8, w: 10.5, h: 0.9,
            fontFace: 'Aptos',
            fontSize: 30,
            bold: true,
            color: COLORS.slideTitle,
            align: 'left',
        })

        // thin divider under the title
        s.addShape(pres.ShapeType.line, {
            x: 0.6, y: 1.75, w: 3, h: 0,
            line: { color: COLORS.accent, width: 2 },
        })

        const points = Array.isArray(slide.points) ? slide.points : []
        if (points.length) {
            const startY = 2.15
            const available = 7.5 - startY - 0.7
            // FIX: dividing available height evenly across points stretched
            // rows into huge gaps on slides with few bullets (e.g. 3 points
            // spread across the whole slide). Cap the row height so it only
            // stretches up to a natural reading size, and top-anchor the
            // rest instead of forcing it to fill the whole slide.
            const rowH = Math.min(0.95, available / points.length)

            points.forEach((point, pi) => {
                const y = startY + pi * rowH

                // square bullet marker
                s.addShape(pres.ShapeType.rect, {
                    x: 0.8, y: y + 0.13, w: 0.14, h: 0.14,
                    fill: { color: COLORS.bulletMarker },
                    line: { type: 'none' },
                })

                s.addText(point, {
                    x: 1.2, y: y, w: 11.2, h: rowH,
                    fontFace: 'Aptos',
                    fontSize: 17,
                    color: COLORS.bullet,
                    align: 'left',
                    valign: 'top',
                    lineSpacingMultiple: 1.25,
                })
            })
        }

        // footer divider
        s.addShape(pres.ShapeType.line, {
            x: 0.6, y: 7.05, w: PAGE_W - 1.2, h: 0,
            line: { color: COLORS.divider, width: 0.75 },
        })

        s.addText('Agent Space', {
            x: 0.6, y: 7.12, w: 4, h: 0.3,
            fontFace: 'Aptos',
            fontSize: 9,
            color: COLORS.footer,
            align: 'left',
        })

        // page pill badge
        s.addShape(pres.ShapeType.roundRect, {
            x: PAGE_W - 1.5, y: 7.08, w: 0.9, h: 0.3,
            rectRadius: 0.15,
            fill: { color: COLORS.watermark },
            line: { type: 'none' },
        })
        s.addText(`${i + 1} / ${totalContentSlides}`, {
            x: PAGE_W - 1.5, y: 7.08, w: 0.9, h: 0.3,
            fontFace: 'Aptos',
            fontSize: 9,
            color: COLORS.eyebrow,
            align: 'center',
            valign: 'middle',
        })
    })

    // =========================================================
    // 3. Closing / Thank you slide
    // =========================================================
    const closing = pres.addSlide()
    closing.background = { color: COLORS.background }

    closing.addShape(pres.ShapeType.ellipse, {
        x: -3, y: PAGE_H - 4, w: 8, h: 8,
        fill: { color: COLORS.backgroundSoft },
        line: { type: 'none' },
    })
    closing.addShape(pres.ShapeType.ellipse, {
        x: -1.2, y: PAGE_H - 2.5, w: 4.5, h: 4.5,
        fill: { color: COLORS.accentDeep, transparency: 80 },
        line: { type: 'none' },
    })

    closing.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: 0.12, h: '100%',
        fill: { color: COLORS.accent },
        line: { type: 'none' },
    })

    closing.addShape(pres.ShapeType.rect, {
        x: 0.8, y: 2.95, w: 0.5, h: 0.05,
        fill: { color: COLORS.accent },
        line: { type: 'none' },
    })

    closing.addText('Thank You', {
        x: 0.8, y: 3.1, w: 11, h: 1.2,
        fontFace: 'Aptos',
        fontSize: 44,
        bold: true,
        color: COLORS.title,
        align: 'left',
    })

    closing.addText('Generated by Agent Space', {
        x: 0.8, y: 4.35, w: 11, h: 0.6,
        fontFace: 'Aptos',
        fontSize: 16,
        color: COLORS.subtitle,
        align: 'left',
    })

    return pres.write({ outputType: 'nodebuffer' })
}