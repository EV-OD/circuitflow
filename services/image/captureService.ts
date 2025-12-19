
export const prepareSvgClone = (svgElement: SVGSVGElement): { clone: SVGSVGElement, width: number, height: number } => {
    // Helper to inline computed styles (fixing Tailwind/CSS class loss in Blob)
    const inlineStyles = (source: Element, target: Element) => {
        const computed = window.getComputedStyle(source);
        const style = (target as any).style;
        
        if (style) {
            // Essential SVG styles
            style.fill = computed.fill;
            style.stroke = computed.stroke;
            style.strokeWidth = computed.strokeWidth;
            style.strokeDasharray = computed.strokeDasharray;
            style.opacity = computed.opacity;
            style.color = computed.color;
            style.fontFamily = computed.fontFamily;
            style.fontSize = computed.fontSize;
            style.fontWeight = computed.fontWeight;
            style.display = computed.display;
            style.visibility = computed.visibility;
        }

        const sourceChildren = source.children;
        const targetChildren = target.children;
        
        for (let i = 0; i < sourceChildren.length; i++) {
            if (targetChildren[i]) {
                inlineStyles(sourceChildren[i], targetChildren[i]);
            }
        }
    };

    // 1. Clone the SVG first
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    
    // 2. Inline Styles
    inlineStyles(svgElement, clone);

    // 3. Remove the Infinite Grid Background
    // This element has a huge dimension (e.g. 50000x50000) which messes up the export size.
    const gridRect = clone.querySelector('#circuit-grid-background');
    let mainGroup: SVGGElement | null = null;
    
    if (gridRect) {
        // The grid is typically inside the main transform group
        mainGroup = gridRect.parentElement as unknown as SVGGElement;
        gridRect.remove();
    } else {
        // Fallback: Try to find the first group if grid not found by ID
        mainGroup = clone.querySelector('g');
    }

    // 4. Reset Transform to Auto-Center
    // We want the export to show the circuit centered and tightly cropped, regardless of current pan/zoom.
    if (mainGroup) {
        mainGroup.removeAttribute('transform');
    }

    // 5. Measure the Tight Bounding Box
    // We must append the clone to the document momentarily to measure it.
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '-9999px';
    div.style.visibility = 'hidden';
    div.appendChild(clone);
    document.body.appendChild(div);

    let x = 0, y = 0, width = 1000, height = 800;

    try {
        // Measure the main group (content only) if possible, otherwise the root
        const target = mainGroup || clone;
        const bbox = target.getBBox();
        
        if (bbox.width > 0 && bbox.height > 0) {
            x = bbox.x;
            y = bbox.y;
            width = bbox.width;
            height = bbox.height;
        }
    } catch (e) {
        console.warn("Failed to calculate BBox for export", e);
    } finally {
        document.body.removeChild(div);
    }

    // 6. Configure ViewBox with Padding
    const padding = 50;
    const finalX = Math.floor(x - padding);
    const finalY = Math.floor(y - padding);
    const finalWidth = Math.ceil(width + padding * 2);
    const finalHeight = Math.ceil(height + padding * 2);

    clone.setAttribute('viewBox', `${finalX} ${finalY} ${finalWidth} ${finalHeight}`);
    clone.setAttribute('width', finalWidth.toString());
    clone.setAttribute('height', finalHeight.toString());
    
    // Explicitly set XMLNS for compatibility
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    return { clone, width: finalWidth, height: finalHeight };
};

export const captureCanvasToSVG = async (svgElement: SVGSVGElement, bgColor?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const { clone } = prepareSvgClone(svgElement);

            // Inject Background Rect if bgColor provided
            if (bgColor) {
                const viewBox = clone.getAttribute('viewBox')?.split(' ').map(Number) || [0,0,1000,1000];
                const [x, y, w, h] = viewBox;
                
                const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                bgRect.setAttribute("x", x.toString());
                bgRect.setAttribute("y", y.toString());
                bgRect.setAttribute("width", w.toString());
                bgRect.setAttribute("height", h.toString());
                bgRect.setAttribute("fill", bgColor);
                
                // Insert as the very first child so it sits behind everything
                if (clone.firstChild) {
                    clone.insertBefore(bgRect, clone.firstChild);
                } else {
                    clone.appendChild(bgRect);
                }
            }

            const data = new XMLSerializer().serializeToString(clone);
            const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
            resolve(URL.createObjectURL(blob));
        } catch (e) {
            reject(e);
        }
    });
};

export const captureCanvas = async (svgElement: SVGSVGElement, bgColor: string = '#ffffff'): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const { clone, width, height } = prepareSvgClone(svgElement);
            
            const data = new XMLSerializer().serializeToString(clone);
            const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Limit canvas size to prevent browser crashes on huge circuits
                const MAX_CANVAS_DIM = 8000;
                let scale = 1;
                if (width > MAX_CANVAS_DIM || height > MAX_CANVAS_DIM) {
                    scale = Math.min(MAX_CANVAS_DIM / width, MAX_CANVAS_DIM / height);
                }

                canvas.width = width * scale;
                canvas.height = height * scale;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error("Canvas Context Error"));
                    return;
                }
                
                // Fill background based on theme
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                try {
                    const base64 = canvas.toDataURL('image/png', 1.0);
                    URL.revokeObjectURL(url);
                    resolve(base64);
                } catch (e) {
                    URL.revokeObjectURL(url);
                    reject(e);
                }
            };
            
            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                console.error("Image loading failed during capture", e);
                reject(new Error("Failed to load SVG into Image for capture."));
            };
            
            img.src = url;

        } catch (e) {
            console.error("Capture Service Error", e);
            reject(e);
        }
    });
};
