// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SVG SECTION IMPORTER v1.0 - Modulo riutilizzabile per analisi SVG         ║
// ║  ─────────────────────────────────────────────────────────────────────────── ║
// ║  Importazione SVG con supporto trasformazioni CTM, calcolo proprietà        ║
// ║  geometriche avanzate, analisi multi-layer e compatibilità FEM v4.1         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

'use strict';

/**
 * SVGSectionImporter - Classe core per l'importazione e analisi di sezioni SVG
 * 
 * Supporta:
 * - Parsing SVG con gestione trasformazioni CTM
 * - Elementi: path, rect, circle, ellipse, polygon, polyline
 * - Calcolo proprietà geometriche (Area, Inerzia, Baricentro)
 * - Logica multi-layer (3 layer: esterno-medio-interno)
 * - Analisi spessore parete minimo
 * - Semplificazione geometria
 */
class SVGSectionImporter {
    constructor(options = {}) {
        this.options = {
            samplingPoints: options.samplingPoints || 400,
            unit: options.unit || 'mm',
            scale: options.scale || 1.0,
            enableLayerDetection: options.enableLayerDetection !== false,
            ...options
        };
    }

    /**
     * Importa un file SVG e calcola le proprietà geometriche
     * @param {string} svgText - Contenuto del file SVG
     * @param {string} fileName - Nome del file (opzionale)
     * @param {string} type - Tipo di sezione: 'beam' o 'insert'
     * @returns {Object} Oggetto con proprietà della sezione
     */
    importSVG(svgText, fileName = '', type = 'beam') {
        try {
            // Parse SVG
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            
            if (doc.querySelector('parsererror')) {
                throw new Error('SVG parsing error: Invalid XML');
            }

            // Crea contenitore nascosto per calcolo CTM
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.pointerEvents = 'none';
            tempDiv.style.top = '-9999px';
            tempDiv.style.left = '-9999px';
            
            const importedSVG = document.importNode(doc.documentElement, true);
            tempDiv.appendChild(importedSVG);
            document.body.appendChild(tempDiv);
            
            try {
                // Estrai elementi geometrici
                const elements = this._extractElements(tempDiv);
                
                if (elements.length === 0) {
                    throw new Error('No geometric elements found in SVG');
                }

                // Converti elementi in contorni con trasformazioni applicate
                const contours = this._elementsToContours(elements);
                
                // Calcola proprietà per ogni contorno
                const shapes = contours.map((contour, index) => {
                    return this._calculateShapeProperties(contour);
                });

                // Ordina per area decrescente
                shapes.sort((a, b) => b.area - a.area);

                // Selezione layer in base al tipo
                const selectedShapes = this._selectLayers(shapes, type);
                
                // Calcola proprietà complessive
                const properties = this._combineShapes(selectedShapes);
                
                // Analizza spessore minimo (se multi-layer)
                if (selectedShapes.length > 1) {
                    properties.minWallThickness = this._analyzeWallThickness(selectedShapes);
                }

                // Genera path per visualizzazione
                properties.pathData = this._generatePathData(selectedShapes);
                
                // Metadata
                properties.fileName = fileName;
                properties.type = type;
                properties.layerInfo = selectedShapes.layerInfo || `${selectedShapes.length} layer(s)`;
                properties.contours = selectedShapes.map(s => s.contour);
                
                return properties;
                
            } finally {
                document.body.removeChild(tempDiv);
            }
            
        } catch (error) {
            console.error('SVG import error:', error);
            throw error;
        }
    }

    /**
     * Estrae elementi geometrici dall'SVG
     */
    _extractElements(container) {
        const selectors = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
        const elements = [];
        
        selectors.forEach(selector => {
            const found = container.querySelectorAll(selector);
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

    /**
     * Converte elementi SVG in contorni di punti con trasformazioni applicate
     */
    _elementsToContours(elements) {
        const contours = [];
        
        elements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            
            // Converti elemento in path
            let pathEl = el;
            if (tagName !== 'path') {
                pathEl = this._convertToPath(el);
            }
            
            if (!pathEl) return;
            
            try {
                const len = pathEl.getTotalLength();
                if (len < 0.1) return;
                
                const points = [];
                const numSteps = this.options.samplingPoints;
                const ctm = pathEl.getCTM();
                
                for (let i = 0; i <= numSteps; i++) {
                    let pt = pathEl.getPointAtLength((i / numSteps) * len);
                    
                    // Applica trasformazione CTM
                    if (ctm) {
                        pt = pt.matrixTransform(ctm);
                    }
                    
                    points.push({ x: pt.x, y: pt.y });
                }
                
                // Chiudi il contorno
                if (points.length > 0) {
                    const first = points[0];
                    const last = points[points.length - 1];
                    const dist = Math.sqrt(
                        (first.x - last.x) ** 2 + (first.y - last.y) ** 2
                    );
                    
                    // Se non è già chiuso, chiudilo
                    if (dist > 0.1) {
                        points.push({ x: first.x, y: first.y });
                    }
                }
                
                contours.push(points);
                
            } catch (e) {
                console.warn('Error processing element:', e);
            }
        });
        
        return contours;
    }

    /**
     * Converte elementi SVG non-path in elementi path
     */
    _convertToPath(element) {
        const tagName = element.tagName.toLowerCase();
        let pathD = '';
        
        switch (tagName) {
            case 'rect':
                const x = parseFloat(element.getAttribute('x')) || 0;
                const y = parseFloat(element.getAttribute('y')) || 0;
                const w = parseFloat(element.getAttribute('width'));
                const h = parseFloat(element.getAttribute('height'));
                pathD = `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
                break;
                
            case 'circle':
                const cx = parseFloat(element.getAttribute('cx')) || 0;
                const cy = parseFloat(element.getAttribute('cy')) || 0;
                const r = parseFloat(element.getAttribute('r'));
                pathD = `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
                break;
                
            case 'ellipse':
                const ecx = parseFloat(element.getAttribute('cx')) || 0;
                const ecy = parseFloat(element.getAttribute('cy')) || 0;
                const rx = parseFloat(element.getAttribute('rx'));
                const ry = parseFloat(element.getAttribute('ry'));
                pathD = `M ${ecx - rx} ${ecy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
                break;
                
            case 'polygon':
            case 'polyline':
                const points = element.getAttribute('points');
                if (points) {
                    pathD = 'M ' + points.trim().replace(/[\s,]+/g, ' ');
                    if (tagName === 'polygon') pathD += ' Z';
                }
                break;
                
            default:
                return null;
        }
        
        if (!pathD) return null;
        
        // Crea elemento path temporaneo
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathD);
        
        // Copia trasformazioni
        const transform = element.getAttribute('transform');
        if (transform) {
            pathEl.setAttribute('transform', transform);
        }
        
        // Inserisci nell'albero DOM per calcolare CTM
        element.parentNode.appendChild(pathEl);
        
        return pathEl;
    }

    /**
     * Calcola proprietà geometriche di un singolo contorno usando Green's theorem
     */
    _calculateShapeProperties(contour) {
        let A = 0, Sx = 0, Sy = 0, Ix_raw = 0, Iy_raw = 0;
        
        for (let i = 0; i < contour.length - 1; i++) {
            const p1 = contour[i];
            const p2 = contour[i + 1];
            const cross = (p1.x * p2.y - p2.x * p1.y);
            
            A += cross;
            Sx += (p1.x + p2.x) * cross;
            Sy += (p1.y + p2.y) * cross;
            Ix_raw += (p1.y * p1.y + p1.y * p2.y + p2.y * p2.y) * cross;
            Iy_raw += (p1.x * p1.x + p1.x * p2.x + p2.x * p2.x) * cross;
        }
        
        A *= 0.5;
        Sx *= (1 / 6);
        Sy *= (1 / 6);
        Ix_raw *= (1 / 12);
        Iy_raw *= (1 / 12);
        
        // Calcola bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        contour.forEach(pt => {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
        });
        
        return {
            area: Math.abs(A),
            signedArea: A,
            Sx,
            Sy,
            Ix_raw,
            Iy_raw,
            contour,
            bounds: { minX, minY, maxX, maxY }
        };
    }

    /**
     * Seleziona i layer appropriati in base al tipo e al numero di contorni
     */
    _selectLayers(shapes, type) {
        if (!this.options.enableLayerDetection) {
            return shapes;
        }

        let selectedShapes = [];
        let layerInfo = '';
        
        if (shapes.length >= 3) {
            if (type === 'beam') {
                // Profilo: Area tra Esterno (0) e Medio (1)
                selectedShapes = [shapes[0], shapes[1]];
                layerInfo = '3 Layer: Profilo (Est - Med)';
            } else if (type === 'insert') {
                // Spalla: Area tra Medio (1) e Interno (2)
                selectedShapes = [shapes[1], shapes[2]];
                layerInfo = '3 Layer: Spalla (Med - Int)';
            }
        } else if (shapes.length === 2) {
            // 2 Layer: Esterno - Interno
            selectedShapes = [shapes[0], shapes[1]];
            layerInfo = '2 Layer: (Est - Int)';
        } else if (shapes.length === 1) {
            // 1 Layer: Solo contorno esterno
            selectedShapes = [shapes[0]];
            layerInfo = '1 Layer: Solid';
        }
        
        selectedShapes.layerInfo = layerInfo;
        return selectedShapes;
    }

    /**
     * Combina più shapes calcolando proprietà complessive
     */
    _combineShapes(shapes) {
        // Calcola area totale (differenza tra contorni)
        let totalArea = 0;
        let totalSx = 0;
        let totalSy = 0;
        let totalIx = 0;
        let totalIy = 0;
        
        shapes.forEach((shape, index) => {
            const sign = index === 0 ? 1 : -1; // Esterno positivo, interni negativi
            totalArea += sign * shape.area;
            totalSx += sign * shape.Sx;
            totalSy += sign * shape.Sy;
            totalIx += sign * shape.Ix_raw;
            totalIy += sign * shape.Iy_raw;
        });
        
        totalArea = Math.abs(totalArea);
        
        // Calcola centroide
        let Cx = 0, Cy = 0;
        if (Math.abs(totalArea) > 1e-9) {
            const signedAreaForCentroid = shapes[0].signedArea - 
                (shapes.length > 1 ? shapes.slice(1).reduce((sum, s) => sum + s.signedArea, 0) : 0);
            Cx = totalSx / signedAreaForCentroid;
            Cy = totalSy / signedAreaForCentroid;
        }
        
        // Calcola inerzia rispetto al centroide (teorema di Steiner)
        const Ixx = totalIx - totalArea * Cy * Cy;
        const Iyy = totalIy - totalArea * Cx * Cx;
        
        // Calcola bounds globali (dal contorno esterno)
        const bounds = shapes[0].bounds;
        
        // Calcola dimensioni
        const width_mm = (bounds.maxX - bounds.minX) * this.options.scale;
        const height_mm = (bounds.maxY - bounds.minY) * this.options.scale;
        
        // Converti unità
        const conversionFactor = this._getConversionFactor(this.options.unit);
        const area_mm2 = totalArea * Math.pow(this.options.scale, 2);
        const I_mm4 = Math.abs(Ixx) * Math.pow(this.options.scale, 4);
        
        return {
            name: '',
            area_mm2,
            I_mm4,
            width_mm,
            height_mm,
            centroid: { x: Cx, y: Cy },
            inertia: { Ixx: Math.abs(Ixx), Iyy: Math.abs(Iyy) },
            bounds,
            shapes
        };
    }

    /**
     * Analizza spessore minimo della parete
     */
    _analyzeWallThickness(shapes) {
        if (shapes.length < 2) return null;
        
        const outer = shapes[0].contour;
        const inner = shapes[1].contour;
        
        let minDist = Infinity;
        let minPoints = null;
        
        // Campiona punti del contorno interno
        const stride = Math.max(1, Math.floor(inner.length / 100));
        
        for (let i = 0; i < inner.length; i += stride) {
            const pt = inner[i];
            
            // Trova distanza minima dal contorno esterno
            for (let j = 0; j < outer.length - 1; j++) {
                const p1 = outer[j];
                const p2 = outer[j + 1];
                
                const dist = this._pointToSegmentDistance(pt, p1, p2);
                
                if (dist < minDist) {
                    minDist = dist;
                    minPoints = { inner: pt, outer: this._closestPointOnSegment(pt, p1, p2) };
                }
            }
        }
        
        return {
            value: minDist * this.options.scale,
            points: minPoints,
            unit: this.options.unit
        };
    }

    /**
     * Calcola distanza punto-segmento
     */
    _pointToSegmentDistance(pt, p1, p2) {
        const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        if (l2 === 0) return Math.sqrt((pt.x - p1.x) ** 2 + (pt.y - p1.y) ** 2);
        
        let t = ((pt.x - p1.x) * (p2.x - p1.x) + (pt.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        
        const projX = p1.x + t * (p2.x - p1.x);
        const projY = p1.y + t * (p2.y - p1.y);
        
        return Math.sqrt((pt.x - projX) ** 2 + (pt.y - projY) ** 2);
    }

    /**
     * Trova punto più vicino su un segmento
     */
    _closestPointOnSegment(pt, p1, p2) {
        const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        if (l2 === 0) return p1;
        
        let t = ((pt.x - p1.x) * (p2.x - p1.x) + (pt.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };
    }

    /**
     * Genera path SVG per visualizzazione
     */
    _generatePathData(shapes) {
        let pathData = '';
        
        shapes.forEach(shape => {
            const contour = shape.contour;
            if (contour.length === 0) return;
            
            pathData += `M ${contour[0].x.toFixed(3)} ${contour[0].y.toFixed(3)} `;
            
            for (let i = 1; i < contour.length; i++) {
                pathData += `L ${contour[i].x.toFixed(3)} ${contour[i].y.toFixed(3)} `;
            }
            
            pathData += 'Z ';
        });
        
        return pathData.trim();
    }

    /**
     * Ottiene fattore di conversione per l'unità specificata
     */
    _getConversionFactor(unit) {
        const factors = {
            'mm': 1,
            'cm': 10,
            'm': 1000,
            'in': 25.4
        };
        return factors[unit] || 1;
    }

    /**
     * Semplifica geometria riducendo il numero di punti
     */
    simplifyGeometry(contour, tolerance = 2.0) {
        if (contour.length < 5) return contour;
        
        const simplified = [contour[0]];
        
        // Douglas-Peucker algorithm semplificato
        for (let i = 1; i < contour.length; i++) {
            const prev = simplified[simplified.length - 1];
            const curr = contour[i];
            
            const dist = Math.sqrt(
                (curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2
            );
            
            if (dist >= tolerance) {
                simplified.push(curr);
            }
        }
        
        // Assicura che sia chiuso
        const first = contour[0];
        const last = simplified[simplified.length - 1];
        if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
            simplified.push({ x: first.x, y: first.y });
        }
        
        return simplified;
    }
}

/**
 * SVGProfileManager - Interfaccia semplificata per uso in index.html
 * 
 * Fornisce metodi di alto livello per:
 * - Caricamento da file input
 * - Gestione profili custom
 * - Export per FEM
 */
class SVGProfileManager {
    constructor(options = {}) {
        this.importer = new SVGSectionImporter(options);
        this.currentProfile = {
            beam: null,
            insert: null
        };
    }

    /**
     * Carica profilo da file input HTML
     * @param {HTMLInputElement} fileInput - Input element con file SVG
     * @param {string} type - Tipo: 'beam' o 'insert'
     * @returns {Promise<Object>} Promise che risolve con le proprietà del profilo
     */
    loadFromFileInput(fileInput, type = 'beam') {
        return new Promise((resolve, reject) => {
            const file = fileInput.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const svgText = event.target.result;
                    const profile = this.importer.importSVG(svgText, file.name, type);
                    
                    // Salva profilo corrente
                    this.currentProfile[type] = profile;
                    
                    resolve(profile);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('File reading error'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Carica profilo da testo SVG
     * @param {string} svgText - Contenuto SVG
     * @param {string} type - Tipo: 'beam' o 'insert'
     * @param {string} fileName - Nome file (opzionale)
     * @returns {Object} Proprietà del profilo
     */
    loadFromText(svgText, type = 'beam', fileName = '') {
        const profile = this.importer.importSVG(svgText, fileName, type);
        this.currentProfile[type] = profile;
        return profile;
    }

    /**
     * Rimuove profilo corrente
     * @param {string} type - Tipo: 'beam' o 'insert'
     */
    clearProfile(type = 'beam') {
        this.currentProfile[type] = null;
    }

    /**
     * Ottiene profilo corrente
     * @param {string} type - Tipo: 'beam' o 'insert'
     * @returns {Object|null} Profilo o null se non caricato
     */
    getProfile(type = 'beam') {
        return this.currentProfile[type];
    }

    /**
     * Verifica se un profilo è caricato
     * @param {string} type - Tipo: 'beam' o 'insert'
     * @returns {boolean}
     */
    hasProfile(type = 'beam') {
        return this.currentProfile[type] !== null;
    }

    /**
     * Esporta dati compatibili con BeamSectionWithHoles (fem_engine_v4.js)
     * @param {string} type - Tipo: 'beam' o 'insert'
     * @returns {Object|null} Dati FEM o null se profilo non caricato
     */
    exportToFEM(type = 'beam') {
        const profile = this.currentProfile[type];
        if (!profile) return null;

        // Conversione unità -> metri
        const toMeters = this.importer._getConversionFactor(this.importer.options.unit) / 1000;
        
        return {
            // Dimensioni geometriche
            width: profile.width_mm * toMeters,
            height: profile.height_mm * toMeters,
            
            // Proprietà sezione
            area: profile.area_mm2 * toMeters * toMeters,
            I_mm4: profile.I_mm4,
            inertia: {
                Ixx: profile.inertia.Ixx * Math.pow(toMeters, 4),
                Iyy: profile.inertia.Iyy * Math.pow(toMeters, 4)
            },
            centroid: {
                x: profile.centroid.x * toMeters,
                y: profile.centroid.y * toMeters
            },
            
            // Spessori (stima basata su min wall thickness se disponibile)
            t_v: profile.minWallThickness ? 
                profile.minWallThickness.value * toMeters : 
                profile.width_mm * toMeters * 0.1,
            t_h: profile.minWallThickness ? 
                profile.minWallThickness.value * toMeters : 
                profile.height_mm * toMeters * 0.1,
            
            // Metadata
            pathData: profile.pathData,
            bounds: profile.bounds,
            layerInfo: profile.layerInfo,
            fileName: profile.fileName,
            type: profile.type
        };
    }

    /**
     * Crea oggetto compatibile con lo stato di index.html
     * @param {string} type - Tipo: 'beam' o 'insert'
     * @returns {Object|null} Oggetto customProfile o null
     */
    toIndexFormat(type = 'beam') {
        const profile = this.currentProfile[type];
        if (!profile) return null;

        return {
            name: profile.fileName || 'Custom Profile',
            I_mm4: profile.I_mm4,
            area_mm2: profile.area_mm2,
            height_mm: profile.height_mm,
            width_mm: profile.width_mm,
            pathData: profile.pathData,
            bounds: profile.bounds,
            layerInfo: profile.layerInfo,
            femData: this.exportToFEM(type)
        };
    }
}

// Esporta per uso globale
if (typeof window !== 'undefined') {
    window.SVGSectionImporter = SVGSectionImporter;
    window.SVGProfileManager = SVGProfileManager;
}
