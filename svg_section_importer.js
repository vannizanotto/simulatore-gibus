// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SVG SECTION IMPORTER v2.0 - Modulo riutilizzabile per analisi SVG         ║
// ║  ─────────────────────────────────────────────────────────────────────────── ║
// ║  Importazione SVG con funzioni estratte da import_000.html                  ║
// ║  Parsing completo, Green's theorem, analisi multi-layer, spessore parete    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

'use strict';

/**
 * SVGSectionImporter - Modulo completo per parsing e analisi sezioni SVG
 * 
 * Funzionalità principali:
 * 1. Parsing SVG Completo - convertToPathD, getContoursBySplitting
 * 2. Analisi Geometrica - calculateProperties (Teorema di Green)
 * 3. Gestione Contorni Multipli - identificazione esterno/interni
 * 4. Analisi Spessore - analyzeThickness per sezioni cave
 */
const SVGSectionImporter = {
    
    /**
     * Converte elementi SVG (rect, circle, ellipse, polygon, polyline) in path d
     * Estratto da import_000.html riga 842
     */
    convertToPathD(el) {
        const t = el.tagName.toLowerCase();
        
        if (t === 'path') {
            return el.getAttribute('d');
        }
        
        if (t === 'rect') {
            const x = parseFloat(el.getAttribute('x')) || 0;
            const y = parseFloat(el.getAttribute('y')) || 0;
            const w = parseFloat(el.getAttribute('width')) || 0;
            const h = parseFloat(el.getAttribute('height')) || 0;
            return `M${x},${y} L${x+w},${y} L${x+w},${y+h} L${x},${y+h} Z`;
        }
        
        if (t === 'circle') {
            const cx = parseFloat(el.getAttribute('cx')) || 0;
            const cy = parseFloat(el.getAttribute('cy')) || 0;
            const r = parseFloat(el.getAttribute('r')) || 0;
            return `M${cx-r},${cy} A${r},${r} 0 1,0 ${cx+r},${cy} A${r},${r} 0 1,0 ${cx-r},${cy} Z`;
        }
        
        if (t === 'ellipse') {
            const cx = parseFloat(el.getAttribute('cx')) || 0;
            const cy = parseFloat(el.getAttribute('cy')) || 0;
            const rx = parseFloat(el.getAttribute('rx')) || 0;
            const ry = parseFloat(el.getAttribute('ry')) || 0;
            return `M${cx-rx},${cy} A${rx},${ry} 0 1,0 ${cx+rx},${cy} A${rx},${ry} 0 1,0 ${cx-rx},${cy} Z`;
        }
        
        if (t === 'polygon' || t === 'polyline') {
            const pts = el.getAttribute('points');
            if (!pts) return null;
            const pairs = pts.trim().split(/[\s,]+/);
            let d = '';
            for (let i = 0; i < pairs.length; i += 2) {
                d += (i === 0 ? 'M' : 'L') + pairs[i] + ',' + pairs[i+1] + ' ';
            }
            if (t === 'polygon') d += 'Z';
            return d;
        }
        
        return null;
    },

    /**
     * Splitta path SVG in contorni separati con supporto CTM
     * Estratto da import_000.html riga 843
     */
    getContoursBySplitting(element, samples = 500) {
        let fullPathD = element.tagName.toLowerCase() !== 'path' 
            ? this.convertToPathD(element) 
            : element.getAttribute('d');
        
        if (!fullPathD) return [];
        
        // Split su M/m (nuovi subpath)
        const subStrings = fullPathD.split(/(?=[Mm])/);
        const contours = [];
        
        // Assicura che esista il container nascosto
        let container = document.getElementById('svgHiddenContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'svgHiddenContainer';
            container.style.cssText = 'width:2000px; height:2000px; position:absolute; top:-9999px; left:-9999px; overflow:hidden;';
            document.body.appendChild(container);
        }
        
        for (const sub of subStrings) {
            if (!sub.trim()) continue;
            
            // Crea path temporaneo per campionamento
            const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            tempPath.setAttribute("d", sub);
            
            // Copia transform se presente
            const tr = element.getAttribute('transform');
            if (tr) {
                tempPath.setAttribute('transform', tr);
            }
            
            // Necessario appendere al DOM per getTotalLength() e getCTM()
            const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            tempSvg.appendChild(tempPath);
            container.appendChild(tempSvg);
            
            let len = 0;
            try {
                len = tempPath.getTotalLength();
            } catch (e) {
                console.warn('Error getting path length:', e);
            }
            
            if (len < 1) {
                container.removeChild(tempSvg);
                continue;
            }
            
            // Ottieni CTM per trasformazioni
            let ctm = null;
            try {
                ctm = tempPath.getCTM();
            } catch (e) {
                console.warn('Error getting CTM:', e);
            }
            
            const points = [];
            const numSamples = Math.min(samples, Math.max(50, Math.ceil(len / 2)));
            
            for (let i = 0; i <= numSamples; i++) {
                let pt = tempPath.getPointAtLength((i / numSamples) * len);
                
                // Applica trasformazione CTM se disponibile
                if (ctm) {
                    pt = pt.matrixTransform(ctm);
                }
                
                points.push({ x: pt.x, y: pt.y });
            }
            
            container.removeChild(tempSvg);
            
            if (points.length > 2) {
                contours.push(points);
            }
        }
        
        return contours;
    },

    /**
     * Calcola proprietà geometriche usando il Teorema di Green
     * Estratto da import_000.html riga 627
     * @param {Array} contours - Array di contorni (array di punti {x, y})
     * @param {number} density - Densità materiale (kg/m³)
     * @param {number} scale - Fattore di scala
     * @param {string} unit - Unità di misura ('mm', 'cm', 'm', 'in')
     * @param {Object} offset - Offset {x, y}
     * @returns {Object} Proprietà: area, centroid, inertia_centroid, linear_mass_kg_m
     */
    calculateProperties(contours, density, scale, unit, offset = {x:0, y:0}) {
        let totalArea = 0, totalSx = 0, totalSy = 0, totalIxx = 0, totalIyy = 0;
        
        contours.forEach(points => {
            let A = 0, Sx = 0, Sy = 0, Ixx = 0, Iyy = 0;
            const n = points.length;
            
            for (let i = 0; i < n - 1; i++) {
                const p1 = { 
                    x: (points[i].x + offset.x) * scale, 
                    y: (points[i].y + offset.y) * scale 
                };
                const p2 = { 
                    x: (points[i+1].x + offset.x) * scale, 
                    y: (points[i+1].y + offset.y) * scale 
                };
                
                const cross = (p1.x * p2.y - p2.x * p1.y);
                A += cross;
                Sx += (p1.y + p2.y) * cross;
                Sy += (p1.x + p2.x) * cross;
                Ixx += (p1.y**2 + p1.y*p2.y + p2.y**2) * cross;
                Iyy += (p1.x**2 + p1.x*p2.x + p2.x**2) * cross;
            }
            
            totalArea += A * 0.5;
            totalSx += Sx / 6;
            totalSy += Sy / 6;
            totalIxx += Ixx / 12;
            totalIyy += Iyy / 12;
        });
        
        const absArea = Math.abs(totalArea);
        let Cx = 0, Cy = 0;
        
        if (absArea > 1e-9) {
            Cx = totalSy / totalArea;
            Cy = totalSx / totalArea;
        }
        
        const Ixx_c = totalIxx - totalArea * Cy * Cy;
        const Iyy_c = totalIyy - totalArea * Cx * Cx;
        
        // Fattore di conversione per massa lineare
        let factor = 1;
        if (unit === 'mm') factor = 1e-6;
        else if (unit === 'cm') factor = 1e-4;
        else if (unit === 'in') factor = 0.00064516;
        
        return {
            area: absArea,
            centroid: { x: Cx, y: Cy },
            inertia_centroid: { Ixx: Math.abs(Ixx_c), Iyy: Math.abs(Iyy_c) },
            linear_mass_kg_m: absArea * factor * density
        };
    },

    /**
     * Trova il punto più vicino su un segmento
     * Estratto da import_000.html riga 678
     */
    getClosestPointOnSegment(p, a, b) {
        const l2 = (a.x - b.x)**2 + (a.y - b.y)**2;
        
        if (l2 === 0) {
            return { 
                pt: a, 
                dist: Math.sqrt((p.x - a.x)**2 + (p.y - a.y)**2) 
            };
        }
        
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        
        const proj = {
            x: a.x + t * (b.x - a.x),
            y: a.y + t * (b.y - a.y)
        };
        
        return {
            pt: proj,
            dist: Math.sqrt((p.x - proj.x)**2 + (p.y - proj.y)**2)
        };
    },

    /**
     * Analizza spessore minimo parete tra contorni esterno e interni
     * Estratto da import_000.html riga 650
     * @param {Array} contours - Array di contorni
     * @returns {Object|null} {min: {val, vec}, all: measurements}
     */
    analyzeThickness(contours) {
        if (contours.length < 2) return null;
        
        // Calcola area di ogni contorno per identificare esterno vs interni
        const contourAreas = contours.map((c, i) => {
            let A = 0;
            for (let j = 0; j < c.length - 1; j++) {
                A += (c[j].x * c[j+1].y - c[j+1].x * c[j].y);
            }
            return { idx: i, area: Math.abs(A * 0.5) };
        });
        
        contourAreas.sort((a, b) => b.area - a.area);
        
        const outerContour = contours[contourAreas[0].idx];
        let globalMinDist = Infinity;
        let minVec = null;
        const allMeasurements = [];
        
        // Per ogni contorno interno, trova distanza minima dal contorno esterno
        for (let i = 1; i < contourAreas.length; i++) {
            const innerPts = contours[contourAreas[i].idx];
            const stride = innerPts.length > 500 ? 2 : 1;
            
            for (let j = 0; j < innerPts.length; j += stride) {
                const pInner = innerPts[j];
                let localMinDist = Infinity;
                let localBestPt = null;
                
                for (let k = 0; k < outerContour.length - 1; k++) {
                    const res = this.getClosestPointOnSegment(
                        pInner, 
                        outerContour[k], 
                        outerContour[k+1]
                    );
                    
                    if (res.dist < localMinDist) {
                        localMinDist = res.dist;
                        localBestPt = res.pt;
                    }
                }
                
                if (localBestPt) {
                    const m = {
                        p1: pInner,
                        p2: localBestPt,
                        dist: localMinDist
                    };
                    allMeasurements.push(m);
                    
                    if (localMinDist < globalMinDist) {
                        globalMinDist = localMinDist;
                        minVec = m;
                    }
                }
            }
        }
        
        return {
            min: { val: globalMinDist, vec: minVec },
            all: allMeasurements
        };
    },

    /**
     * Crea dati profilo compatibili con state.customProfile di index.html
     * @param {Array} contours - Array di contorni
     * @param {Object} bounds - Bounding box {minX, minY, maxX, maxY}
     * @param {Object} options - Opzioni {name, density, scale, unit}
     * @returns {Object} Oggetto compatibile con customProfile
     */
    createProfileData(contours, bounds, options = {}) {
        const {
            name = 'Custom Profile',
            density = 2700, // kg/m³ default alluminio
            scale = 1.0,
            unit = 'mm'
        } = options;
        
        // Calcola proprietà geometriche
        const props = this.calculateProperties(contours, density, scale, unit);
        
        // Calcola dimensioni
        const width_mm = Math.abs(bounds.maxX - bounds.minX) * scale;
        const height_mm = Math.abs(bounds.maxY - bounds.minY) * scale;
        
        // Analizza spessore se multi-layer
        let minWallThickness = null;
        if (contours.length > 1) {
            const thickness = this.analyzeThickness(contours);
            if (thickness && thickness.min) {
                minWallThickness = thickness.min.val * scale;
            }
        }
        
        // Genera pathData per visualizzazione
        let pathData = '';
        contours.forEach((pts, idx) => {
            if (pts.length < 2) return;
            pathData += `M${pts[0].x},${pts[0].y} `;
            for (let i = 1; i < pts.length; i++) {
                pathData += `L${pts[i].x},${pts[i].y} `;
            }
            pathData += 'Z ';
        });
        
        return {
            name: name,
            I_mm4: props.inertia_centroid.Ixx, // Usa Ixx come momento principale
            area_mm2: props.area,
            height_mm: height_mm,
            width_mm: width_mm,
            pathData: pathData.trim(),
            bounds: bounds,
            contours: contours, // NUOVO: per analisi spessore
            min_wall_thickness: minWallThickness // NUOVO: spessore minimo parete
        };
    }
};

/**
 * SVGProfileManager - Classe wrapper per gestire profili SVG
 * Mantiene compatibilità con codice esistente
 */
class SVGProfileManager {
    constructor() {
        this.currentProfile = {
            beam: null,
            insert: null
        };
    }

    /**
     * Carica SVG da testo
     */
    loadFromText(svgText, type = 'beam', fileName = 'Custom Profile') {
        try {
            // Parse SVG
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            
            if (doc.querySelector('parsererror')) {
                throw new Error('SVG parsing error: Invalid XML');
            }
            
            // Estrai elementi geometrici
            const svgEl = doc.documentElement;
            const elements = this._extractElements(svgEl);
            
            if (elements.length === 0) {
                throw new Error('No geometric elements found in SVG');
            }
            
            // Crea contenitore temporaneo nel DOM
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'position:absolute; visibility:hidden; top:-9999px; left:-9999px;';
            const importedSVG = document.importNode(svgEl, true);
            tempDiv.appendChild(importedSVG);
            document.body.appendChild(tempDiv);
            
            try {
                // Converti ogni elemento in contorni
                const allContours = [];
                elements.forEach(el => {
                    const contours = SVGSectionImporter.getContoursBySplitting(el, 500);
                    allContours.push(...contours);
                });
                
                if (allContours.length === 0) {
                    throw new Error('No contours extracted from SVG');
                }
                
                // Calcola bounding box
                let minX = Infinity, minY = Infinity;
                let maxX = -Infinity, maxY = -Infinity;
                
                allContours.forEach(contour => {
                    contour.forEach(pt => {
                        minX = Math.min(minX, pt.x);
                        minY = Math.min(minY, pt.y);
                        maxX = Math.max(maxX, pt.x);
                        maxY = Math.max(maxY, pt.y);
                    });
                });
                
                const bounds = { minX, minY, maxX, maxY };
                
                // Crea profile data
                const profileData = SVGSectionImporter.createProfileData(
                    allContours,
                    bounds,
                    { name: fileName, density: 2700, scale: 1.0, unit: 'mm' }
                );
                
                this.currentProfile[type] = profileData;
                return profileData;
                
            } finally {
                document.body.removeChild(tempDiv);
            }
            
        } catch (error) {
            console.error('SVG load error:', error);
            throw error;
        }
    }

    _extractElements(svgElement) {
        const selectors = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
        const elements = [];
        
        selectors.forEach(selector => {
            const found = svgElement.querySelectorAll(selector);
            found.forEach(el => {
                // Ignora elementi nascosti
                if (el.getAttribute('display') === 'none' || 
                    el.style.display === 'none') {
                    return;
                }
                elements.push(el);
            });
        });
        
        return elements;
    }

    toIndexFormat(type = 'beam') {
        const profile = this.currentProfile[type];
        if (!profile) return null;

        return {
            name: profile.name || 'Custom Profile',
            I_mm4: profile.I_mm4,
            area_mm2: profile.area_mm2,
            height_mm: profile.height_mm,
            width_mm: profile.width_mm,
            pathData: profile.pathData,
            bounds: profile.bounds,
            layerInfo: `${profile.contours ? profile.contours.length : 1} layer(s)`,
            contours: profile.contours,
            min_wall_thickness: profile.min_wall_thickness
        };
    }

    exportToFEM(type = 'beam') {
        const profile = this.currentProfile[type];
        if (!profile) return null;

        return {
            contours: profile.contours,
            area_mm2: profile.area_mm2,
            I_mm4: profile.I_mm4,
            bounds: profile.bounds
        };
    }
}

// Esporta per uso globale
if (typeof window !== 'undefined') {
    window.SVGSectionImporter = SVGSectionImporter;
    window.SVGProfileManager = SVGProfileManager;
}
