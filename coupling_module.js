// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  COUPLING MODULE - Modulo Accoppiamento Spalla-Profilo                       ║
// ║  ─────────────────────────────────────────────────────────────────────────── ║
// ║  Analisi connessione: Colla strutturale + Fissaggi meccanici + Forza Ft      ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

'use strict';

// ============================================================================
// COSTANTI MODULO ACCOPPIAMENTO
// ============================================================================
/**
 * Costanti per l'analisi dell'accoppiamento spalla-profilo
 * Unità: mm, N, MPa
 */
const COUPLING_CONSTANTS = {
    // Fattore combinazione adhesivo + fissaggi meccanici (EC9 / pratica ingegneristica)
    // Quando entrambi i sistemi sono attivi, la capacità non è perfettamente additiva
    COMBINATION_FACTOR: 0.9,
    
    // Fattore sicurezza minimo
    MIN_SAFETY_FACTOR: 1.0,
    
    // Fattore sicurezza raccomandato
    RECOMMENDED_SAFETY_FACTOR: 1.5,
    
    // Rigidezza minima interfaccia (N/mm) per evitare singolarità
    MIN_INTERFACE_STIFFNESS: 1e3,
    
    // Slip massimo ammissibile (mm)
    MAX_ALLOWABLE_SLIP: 0.5,
    
    // Soglie stato connessione (rapporti utilizzo)
    STATUS_THRESHOLDS: {
        OTTIMO: 0.5,      // Utilizzo < 50%
        OK: 0.8,          // Utilizzo < 80%
        ATTENZIONE: 1.0   // Utilizzo < 100%, beyond = CRITICO
    },
    
    // Valore massimo per fattore sicurezza (per display)
    MAX_SAFETY_FACTOR_DISPLAY: 99.99,
    
    // Braccio minimo effettivo per evitare divisione per zero (m)
    MIN_EFFECTIVE_ARM: 0.01,
    
    // Fattore di riduzione per fatica (cicli ripetuti)
    FATIGUE_REDUCTION_FACTOR: 0.7,
    
    // Coefficiente attrito alluminio-alluminio (statico)
    FRICTION_COEFFICIENT_AL_AL: 0.45,
    
    // Coefficiente attrito con adesivo (interfaccia)
    FRICTION_COEFFICIENT_ADHESIVE: 0.6
};

// ============================================================================
// DATABASE ADESIVI STRUTTURALI
// ============================================================================
/**
 * Database adesivi strutturali per connessione alluminio-alluminio
 * Proprietà basate su schede tecniche produttori (Henkel, 3M, Sika)
 * 
 * Unità:
 * - tau_Rd: Resistenza a taglio di progetto [MPa]
 * - G: Modulo di taglio [MPa]
 * - E: Modulo di Young [MPa]
 * - thickness_range: Range spessore consigliato [mm]
 * - temp_min/max: Range temperatura operativa [°C]
 */
const ADHESIVES_DB = {
    // Epossidici bicomponente
    'epoxy-standard': {
        name: 'Epossidico Bicomponente Standard',
        type: 'epoxy',
        tau_Rd: 15,              // MPa - resistenza taglio design
        tau_Rk: 22,              // MPa - resistenza taglio caratteristica
        G: 800,                  // MPa - modulo di taglio
        E: 2500,                 // MPa - modulo elastico
        thickness_range: [0.2, 0.8],
        temp_min: -40,
        temp_max: 80,
        cure_time_h: 24,
        gap_filling: true,
        description: 'Adesivo epossidico strutturale per uso generale'
    },
    'epoxy-high-strength': {
        name: 'Epossidico Alta Resistenza',
        type: 'epoxy',
        tau_Rd: 25,
        tau_Rk: 35,
        G: 1200,
        E: 3500,
        thickness_range: [0.1, 0.5],
        temp_min: -55,
        temp_max: 120,
        cure_time_h: 48,
        gap_filling: true,
        description: 'Adesivo epossidico ad alta resistenza per carichi elevati'
    },
    'epoxy-flexible': {
        name: 'Epossidico Flessibile',
        type: 'epoxy',
        tau_Rd: 12,
        tau_Rk: 18,
        G: 400,
        E: 1200,
        thickness_range: [0.3, 1.0],
        temp_min: -40,
        temp_max: 100,
        cure_time_h: 24,
        gap_filling: true,
        description: 'Adesivo epossidico flessibile per giunti con dilatazioni termiche'
    },
    
    // Acrilici strutturali
    'acrylic-structural': {
        name: 'Acrilico Strutturale',
        type: 'acrylic',
        tau_Rd: 18,
        tau_Rk: 26,
        G: 600,
        E: 2000,
        thickness_range: [0.2, 0.6],
        temp_min: -40,
        temp_max: 150,
        cure_time_h: 1,
        gap_filling: false,
        description: 'Adesivo acrilico strutturale a polimerizzazione rapida'
    },
    'acrylic-methacrylate': {
        name: 'Metacrilato Modificato',
        type: 'acrylic',
        tau_Rd: 20,
        tau_Rk: 28,
        G: 700,
        E: 2200,
        thickness_range: [0.1, 0.8],
        temp_min: -40,
        temp_max: 120,
        cure_time_h: 0.5,
        gap_filling: true,
        description: 'Adesivo metacrilato ad alta resistenza e polimerizzazione veloce'
    },
    
    // Poliuretanici
    'polyurethane-structural': {
        name: 'Poliuretanico Strutturale',
        type: 'polyurethane',
        tau_Rd: 10,
        tau_Rk: 15,
        G: 300,
        E: 800,
        thickness_range: [0.5, 1.5],
        temp_min: -40,
        temp_max: 80,
        cure_time_h: 24,
        gap_filling: true,
        description: 'Adesivo poliuretanico flessibile per giunti dinamici'
    },
    
    // Siliconici strutturali
    'silicone-structural': {
        name: 'Silicone Strutturale',
        type: 'silicone',
        tau_Rd: 1.5,
        tau_Rk: 2.5,
        G: 50,
        E: 150,
        thickness_range: [1.0, 6.0],
        temp_min: -60,
        temp_max: 200,
        cure_time_h: 72,
        gap_filling: true,
        description: 'Sigillante siliconico strutturale per movimenti elevati'
    },
    
    // Nastri adesivi strutturali
    'tape-vhb': {
        name: 'Nastro VHB Strutturale',
        type: 'tape',
        tau_Rd: 8,
        tau_Rk: 12,
        G: 200,
        E: 600,
        thickness_range: [0.5, 2.3],
        temp_min: -40,
        temp_max: 90,
        cure_time_h: 72,
        gap_filling: false,
        description: 'Nastro biadesivo strutturale VHB per applicazioni permanenti'
    }
};

// ============================================================================
// DATABASE FISSAGGI MECCANICI (Esteso per accoppiamento)
// ============================================================================
/**
 * Database fissaggi meccanici per accoppiamento
 * Unità: mm, N, MPa
 */
const FASTENERS_COUPLING_DB = {
    // Viti
    'screw-m3': {
        name: 'Vite M3',
        type: 'screw',
        diameter: 3.0,       // mm - diametro nominale
        d_hole: 3.2,         // mm - diametro foro
        F_v_Rd: 2400,        // N - resistenza a taglio per vite (classe 4.6)
        F_t_Rd: 3600,        // N - resistenza a trazione
        k_shear: 8000,       // N/mm - rigidezza a taglio
        min_edge_distance: 6, // mm
        min_spacing: 9        // mm
    },
    'screw-m4': {
        name: 'Vite M4',
        type: 'screw',
        diameter: 4.0,
        d_hole: 4.2,
        F_v_Rd: 4200,
        F_t_Rd: 6400,
        k_shear: 12000,
        min_edge_distance: 8,
        min_spacing: 12
    },
    'screw-m5': {
        name: 'Vite M5',
        type: 'screw',
        diameter: 5.0,
        d_hole: 5.2,
        F_v_Rd: 6600,
        F_t_Rd: 10000,
        k_shear: 18000,
        min_edge_distance: 10,
        min_spacing: 15
    },
    'screw-m6': {
        name: 'Vite M6',
        type: 'screw',
        diameter: 6.0,
        d_hole: 6.2,
        F_v_Rd: 9500,
        F_t_Rd: 14400,
        k_shear: 25000,
        min_edge_distance: 12,
        min_spacing: 18
    },
    
    // Rivetti
    'rivet-3': {
        name: 'Rivetto Ø3.2',
        type: 'rivet',
        diameter: 3.2,
        d_hole: 3.3,
        F_v_Rd: 1800,
        F_t_Rd: 1200,
        k_shear: 6000,
        min_edge_distance: 6,
        min_spacing: 10
    },
    'rivet-4': {
        name: 'Rivetto Ø4.0',
        type: 'rivet',
        diameter: 4.0,
        d_hole: 4.1,
        F_v_Rd: 2800,
        F_t_Rd: 1900,
        k_shear: 9000,
        min_edge_distance: 8,
        min_spacing: 12
    },
    'rivet-5': {
        name: 'Rivetto Ø4.8',
        type: 'rivet',
        diameter: 4.8,
        d_hole: 4.9,
        F_v_Rd: 4000,
        F_t_Rd: 2700,
        k_shear: 12000,
        min_edge_distance: 10,
        min_spacing: 14
    },
    'rivet-6': {
        name: 'Rivetto Ø6.4',
        type: 'rivet',
        diameter: 6.4,
        d_hole: 6.5,
        F_v_Rd: 7100,
        F_t_Rd: 4800,
        k_shear: 20000,
        min_edge_distance: 13,
        min_spacing: 19
    }
};

// ============================================================================
// CLASSE CouplingAnalysis - Analisi Accoppiamento Spalla-Profilo
// ============================================================================
/**
 * Classe per l'analisi dell'accoppiamento tra spalla e profilo.
 * Supporta combinazione di: colla strutturale, fissaggi meccanici, forza tangenziale Ft.
 * 
 * La logica di combinazione segue le best practice ingegneristiche:
 * - Se solo adesivo attivo: F_Rd = F_adhesive
 * - Se solo fissaggi attivi: F_Rd = F_fasteners
 * - Se entrambi attivi: F_Rd = COMBINATION_FACTOR × (F_adhesive + F_fasteners)
 * - Ft viene sempre aggiunto se abilitato
 * 
 * @example
 * const analysis = new CouplingAnalysis({
 *     interfaceLength: 300,  // mm
 *     interfaceWidth: 33,    // mm
 *     enableAdhesive: true,
 *     adhesiveType: 'epoxy-standard',
 *     adhesiveThickness: 0.5
 * });
 * const result = analysis.verify();
 */
class CouplingAnalysis {
    /**
     * @param {Object} params - Parametri dell'analisi
     * @param {number} params.interfaceLength - Lunghezza interfaccia (mm) = penetrazione
     * @param {number} params.interfaceWidth - Larghezza interfaccia (mm) = larghezza profilo
     * @param {boolean} params.enableAdhesive - Abilita contributo colla
     * @param {boolean} params.enableFasteners - Abilita contributo fissaggi meccanici
     * @param {boolean} params.enableFt - Abilita forza tangenziale manuale
     * @param {string} params.adhesiveType - Tipo adesivo da ADHESIVES_DB
     * @param {number} params.adhesiveThickness - Spessore adesivo (mm)
     * @param {string} params.fastenerType - Tipo fissaggio da FASTENERS_COUPLING_DB
     * @param {number} params.numFasteners - Numero fissaggi
     * @param {number} params.fastenerSpacing - Passo tra fissaggi (mm)
     * @param {number} params.Ft_Ed - Forza tangenziale di progetto (N)
     * @param {number} params.Ft_manual - Forza tangenziale manuale (N)
     */
    constructor(params = {}) {
        // Geometria interfaccia
        this.interfaceLength = params.interfaceLength || 300;  // mm
        this.interfaceWidth = params.interfaceWidth || 33;     // mm
        
        // Toggle per ogni contributo
        this.enableAdhesive = params.enableAdhesive !== undefined ? params.enableAdhesive : false;
        this.enableFasteners = params.enableFasteners !== undefined ? params.enableFasteners : false;
        this.enableFt = params.enableFt !== undefined ? params.enableFt : false;
        
        // Parametri adesivo
        this.adhesiveType = params.adhesiveType || 'epoxy-standard';
        this.adhesiveThickness = params.adhesiveThickness || 0.5;  // mm
        
        // Parametri fissaggi
        this.fastenerType = params.fastenerType || 'screw-m4';
        this.numFasteners = params.numFasteners || 3;
        this.fastenerSpacing = params.fastenerSpacing || 100;  // mm
        
        // Forza tangenziale
        this.Ft_Ed = params.Ft_Ed || 0;       // N - forza di progetto (calcolata)
        this.Ft_manual = params.Ft_manual || 0; // N - forza manuale
        
        // Risultati calcolati
        this._results = null;
    }
    
    /**
     * Calcola la capacità resistente dell'adesivo
     * F_adhesive,Rd = tau_Rd × A_interface × fattore_spessore
     * @returns {Object} Capacità e rigidezza adesivo
     */
    calculateAdhesiveCapacity() {
        if (!this.enableAdhesive) {
            return { F_Rd: 0, stiffness: 0, tau_Rd: 0, area: 0 };
        }
        
        const adhesive = ADHESIVES_DB[this.adhesiveType];
        if (!adhesive) {
            console.warn('Adhesive type not found: ' + this.adhesiveType);
            return { F_Rd: 0, stiffness: 0, tau_Rd: 0, area: 0 };
        }
        
        // Area interfaccia (mm²)
        const A_interface = this.interfaceLength * this.interfaceWidth;
        
        // Fattore correttivo spessore adesivo
        // Lo spessore ottimale è nel range consigliato
        const t_min = adhesive.thickness_range[0];
        const t_max = adhesive.thickness_range[1];
        const t_opt = (t_min + t_max) / 2;
        let thicknessFactor = 1.0;
        
        if (this.adhesiveThickness < t_min) {
            // Spessore troppo sottile: riduzione resistenza
            thicknessFactor = this.adhesiveThickness / t_min;
        } else if (this.adhesiveThickness > t_max) {
            // Spessore troppo spesso: riduzione resistenza (difetti, bolle)
            thicknessFactor = Math.max(0.7, t_max / this.adhesiveThickness);
        }
        
        // Resistenza a taglio di progetto (N)
        const tau_Rd = adhesive.tau_Rd * thicknessFactor;
        const F_Rd = tau_Rd * A_interface;
        
        // Rigidezza tangenziale (N/mm)
        // k = G × A / t
        const stiffness = (adhesive.G * A_interface) / this.adhesiveThickness;
        
        return {
            F_Rd: F_Rd,
            stiffness: stiffness,
            tau_Rd: tau_Rd,
            area: A_interface,
            adhesive: adhesive,
            thicknessFactor: thicknessFactor
        };
    }
    
    /**
     * Calcola la capacità resistente dei fissaggi meccanici
     * F_fasteners,Rd = n × F_v,Rd_singolo
     * @returns {Object} Capacità e rigidezza fissaggi
     */
    calculateFastenersCapacity() {
        if (!this.enableFasteners || this.numFasteners === 0) {
            return { F_Rd: 0, stiffness: 0, perFastener: 0 };
        }
        
        const fastener = FASTENERS_COUPLING_DB[this.fastenerType];
        if (!fastener) {
            console.warn('Fastener type not found: ' + this.fastenerType);
            return { F_Rd: 0, stiffness: 0, perFastener: 0 };
        }
        
        // Resistenza totale a taglio (N)
        const F_Rd = fastener.F_v_Rd * this.numFasteners;
        
        // Rigidezza totale (N/mm)
        // I fissaggi lavorano in parallelo
        const stiffness = fastener.k_shear * this.numFasteners;
        
        // Verifica spaziatura minima
        const spacingOk = this.fastenerSpacing >= fastener.min_spacing;
        
        return {
            F_Rd: F_Rd,
            stiffness: stiffness,
            perFastener: fastener.F_v_Rd,
            fastener: fastener,
            spacingOk: spacingOk,
            minSpacing: fastener.min_spacing
        };
    }
    
    /**
     * Calcola la capacità combinata totale
     * Implementa la logica di combinazione:
     * - Solo adesivo: F_Rd = F_adhesive
     * - Solo fissaggi: F_Rd = F_fasteners  
     * - Entrambi: F_Rd = 0.9 × (F_adhesive + F_fasteners)
     * - Ft sempre aggiunto se abilitato
     * @returns {Object} Capacità combinata
     */
    calculateCombinedCapacity() {
        const adhesiveResult = this.calculateAdhesiveCapacity();
        const fastenersResult = this.calculateFastenersCapacity();
        
        let F_Rd = 0;
        let totalStiffness = 0;
        let combinationApplied = false;
        
        // Logica combinazione libera
        if (this.enableAdhesive && this.enableFasteners) {
            // Entrambi attivi: applica fattore combinazione
            F_Rd = COUPLING_CONSTANTS.COMBINATION_FACTOR * (adhesiveResult.F_Rd + fastenersResult.F_Rd);
            // Rigidezza in parallelo (ridotta per la combinazione)
            totalStiffness = COUPLING_CONSTANTS.COMBINATION_FACTOR * (adhesiveResult.stiffness + fastenersResult.stiffness);
            combinationApplied = true;
        } else if (this.enableAdhesive) {
            // Solo adesivo
            F_Rd = adhesiveResult.F_Rd;
            totalStiffness = adhesiveResult.stiffness;
        } else if (this.enableFasteners) {
            // Solo fissaggi
            F_Rd = fastenersResult.F_Rd;
            totalStiffness = fastenersResult.stiffness;
        }
        
        // Forza tangenziale Ft
        // Ft positivo = resistenza aggiuntiva (favorevole)
        // Ft negativo = carico aggiuntivo (sfavorevole) - viene considerato nella verifica
        let Ft_applied = 0;
        if (this.enableFt) {
            Ft_applied = this.Ft_manual;
        }
        
        // Capacità totale: F_Rd + Ft se favorevole
        // Se Ft è negativo (sfavorevole), non contribuisce alla resistenza
        const F_Rd_total = F_Rd + Math.max(0, Ft_applied);
        
        // Rigidezza minima per evitare singolarità
        totalStiffness = Math.max(COUPLING_CONSTANTS.MIN_INTERFACE_STIFFNESS, totalStiffness);
        
        return {
            F_Rd: F_Rd,
            F_Rd_total: F_Rd_total,
            F_adhesive: adhesiveResult.F_Rd,
            F_fasteners: fastenersResult.F_Rd,
            Ft: Ft_applied,
            stiffness: totalStiffness,
            stiffness_adhesive: adhesiveResult.stiffness,
            stiffness_fasteners: fastenersResult.stiffness,
            combinationApplied: combinationApplied,
            combinationFactor: COUPLING_CONSTANTS.COMBINATION_FACTOR
        };
    }
    
    /**
     * Calcola lo scorrimento (slip) dell'interfaccia
     * slip = Ft_Ed / k_total
     * @param {number} Ft_Ed - Forza tangenziale di progetto (N)
     * @returns {number} Scorrimento in mm
     */
    calculateSlip(Ft_Ed) {
        const combined = this.calculateCombinedCapacity();
        if (combined.stiffness <= 0) {
            return Infinity;
        }
        return Ft_Ed / combined.stiffness;
    }
    
    /**
     * Verifica l'accoppiamento e restituisce i risultati completi
     * @param {number} Ft_Ed_override - Forza tangenziale di progetto opzionale (N)
     * @returns {Object} Risultati verifica completi
     */
    verify(Ft_Ed_override = null) {
        // Determina Ft_Ed da usare
        const Ft_Ed = Ft_Ed_override !== null ? Ft_Ed_override : 
                      (this.enableFt ? this.Ft_manual : this.Ft_Ed);
        
        // Calcola capacità
        const adhesive = this.calculateAdhesiveCapacity();
        const fasteners = this.calculateFastenersCapacity();
        const combined = this.calculateCombinedCapacity();
        
        // Calcola utilizzo
        // L'utilizzo è il rapporto tra forza applicata e resistenza
        // Se F_Rd_total è zero e Ft_Ed > 0, utilizzo è massimo (clamped)
        let utilization = 0;
        if (combined.F_Rd_total > 0) {
            utilization = Ft_Ed / combined.F_Rd_total;
        } else if (Ft_Ed > 0) {
            utilization = COUPLING_CONSTANTS.MAX_SAFETY_FACTOR_DISPLAY; // Clamp to max displayable
        }
        
        // Calcola scorrimento
        const slip = this.calculateSlip(Ft_Ed);
        
        // Calcola fattore di sicurezza (clamped to max displayable value)
        let SF = COUPLING_CONSTANTS.MAX_SAFETY_FACTOR_DISPLAY;
        if (Ft_Ed > 0 && combined.F_Rd_total > 0) {
            SF = Math.min(combined.F_Rd_total / Ft_Ed, COUPLING_CONSTANTS.MAX_SAFETY_FACTOR_DISPLAY);
        } else if (Ft_Ed <= 0 && combined.F_Rd_total > 0) {
            SF = COUPLING_CONSTANTS.MAX_SAFETY_FACTOR_DISPLAY; // No load = infinite SF
        } else if (combined.F_Rd_total <= 0 && Ft_Ed > 0) {
            SF = 0; // No resistance with load = zero SF
        }
        
        // Determina stato
        let status = 'CRITICO';
        const thresholds = COUPLING_CONSTANTS.STATUS_THRESHOLDS;
        if (utilization < thresholds.OTTIMO) {
            status = 'OTTIMO';
        } else if (utilization < thresholds.OK) {
            status = 'OK';
        } else if (utilization < thresholds.ATTENZIONE) {
            status = 'ATTENZIONE';
        }
        
        // Verifica slip ammissibile
        const slipOk = slip <= COUPLING_CONSTANTS.MAX_ALLOWABLE_SLIP;
        
        // Risultati
        this._results = {
            // Forze
            Ft_Ed: Ft_Ed,
            Ft_Rd: combined.F_Rd_total,
            F_adhesive_Rd: adhesive.F_Rd,
            F_fasteners_Rd: fasteners.F_Rd,
            Ft_contribution: combined.Ft,
            
            // Contributi percentuali
            adhesiveContribution: combined.F_Rd > 0 ? (adhesive.F_Rd / combined.F_Rd) * 100 : 0,
            fastenersContribution: combined.F_Rd > 0 ? (fasteners.F_Rd / combined.F_Rd) * 100 : 0,
            ftContribution: combined.F_Rd_total > 0 ? (combined.Ft / combined.F_Rd_total) * 100 : 0,
            
            // Rigidezza
            totalStiffness: combined.stiffness,
            adhesiveStiffness: adhesive.stiffness,
            fastenersStiffness: fasteners.stiffness,
            
            // Verifica
            utilization: utilization,
            utilizationPercent: utilization * 100,
            slip: slip,
            slipOk: slipOk,
            SF: SF,
            status: status,
            
            // Flag
            combinationApplied: combined.combinationApplied,
            combinationFactor: combined.combinationFactor,
            
            // Dettagli
            adhesiveDetails: adhesive,
            fastenersDetails: fasteners,
            
            // Input per riferimento
            enableAdhesive: this.enableAdhesive,
            enableFasteners: this.enableFasteners,
            enableFt: this.enableFt
        };
        
        return this._results;
    }
    
    /**
     * Restituisce gli ultimi risultati calcolati
     * @returns {Object|null}
     */
    getResults() {
        return this._results;
    }
    
    /**
     * Aggiorna i parametri e ricalcola
     * @param {Object} params - Nuovi parametri
     * @returns {Object} Nuovi risultati
     */
    update(params) {
        Object.assign(this, params);
        return this.verify();
    }
}

// ============================================================================
// CLASSE InterfaceElement - Elemento Interfaccia per FEM
// ============================================================================
/**
 * Elemento di interfaccia per modellazione FEM dell'accoppiamento.
 * Produce una matrice di rigidezza 4×4 per connettere i DOF di due nodi.
 * 
 * La matrice modella la rigidezza tangenziale e normale dell'interfaccia.
 * 
 * DOF locali:
 * - Nodo 1: u1 (tangenziale), v1 (normale)
 * - Nodo 2: u2 (tangenziale), v2 (normale)
 */
class InterfaceElement {
    /**
     * @param {Object} params - Parametri elemento
     * @param {number} params.length - Lunghezza elemento (mm)
     * @param {number} params.width - Larghezza elemento (mm)
     * @param {number} params.k_t - Rigidezza tangenziale per unità area (N/mm³)
     * @param {number} params.k_n - Rigidezza normale per unità area (N/mm³)
     * @param {number} params.tau_max - Resistenza massima a taglio (MPa)
     * @param {number} params.sigma_max - Resistenza massima normale (MPa)
     */
    constructor(params = {}) {
        this.length = params.length || 100;     // mm
        this.width = params.width || 33;        // mm
        this.k_t = params.k_t || 100;           // N/mm³ (rigidezza tangenziale)
        this.k_n = params.k_n || 1000;          // N/mm³ (rigidezza normale)
        this.tau_max = params.tau_max || 15;    // MPa
        this.sigma_max = params.sigma_max || 30; // MPa
        
        // Stato elemento
        this.state = {
            slip_t: 0,          // Scorrimento tangenziale (mm)
            gap_n: 0,           // Apertura normale (mm)
            damage: 0,          // Parametro danno (0-1)
            status: 'elastic'   // 'elastic', 'yielding', 'damaged', 'failed'
        };
    }
    
    /**
     * Calcola l'area dell'elemento
     * @returns {number} Area in mm²
     */
    getArea() {
        return this.length * this.width;
    }
    
    /**
     * Calcola la matrice di rigidezza 4×4 dell'elemento
     * 
     * La matrice è strutturata come:
     * [K_tt  0    -K_tt  0   ]   [u1]   [F_t1]
     * [0     K_nn  0    -K_nn] × [v1] = [F_n1]
     * [-K_tt 0     K_tt  0   ]   [u2]   [F_t2]
     * [0    -K_nn  0     K_nn]   [v2]   [F_n2]
     * 
     * @returns {Array<Array<number>>} Matrice 4×4
     */
    getStiffnessMatrix() {
        const A = this.getArea();
        
        // Rigidezza totale
        const K_tt = this.k_t * A;  // N/mm
        const K_nn = this.k_n * A;  // N/mm
        
        // Fattore danno (riduce la rigidezza)
        const damageFactor = 1 - this.state.damage;
        
        const K_tt_eff = K_tt * damageFactor;
        const K_nn_eff = K_nn * damageFactor;
        
        // Matrice 4×4
        return [
            [ K_tt_eff,  0,        -K_tt_eff,  0        ],
            [ 0,         K_nn_eff,  0,        -K_nn_eff ],
            [-K_tt_eff,  0,         K_tt_eff,  0        ],
            [ 0,        -K_nn_eff,  0,         K_nn_eff ]
        ];
    }
    
    /**
     * Aggiorna lo stato dell'elemento basato sugli spostamenti
     * @param {Array<number>} displacements - [u1, v1, u2, v2] in mm
     * @returns {Object} Stato aggiornato
     */
    updateState(displacements) {
        const [u1, v1, u2, v2] = displacements;
        
        // Scorrimento tangenziale relativo
        this.state.slip_t = u2 - u1;
        
        // Apertura normale relativa
        this.state.gap_n = v2 - v1;
        
        // Calcola tensioni
        const tau = this.k_t * Math.abs(this.state.slip_t);
        const sigma = this.k_n * Math.abs(this.state.gap_n);
        
        // Verifica stato
        if (tau > this.tau_max || sigma > this.sigma_max) {
            // Superato limite: danno
            const tau_ratio = tau / this.tau_max;
            const sigma_ratio = sigma / this.sigma_max;
            const max_ratio = Math.max(tau_ratio, sigma_ratio);
            
            if (max_ratio > 1.5) {
                this.state.status = 'failed';
                this.state.damage = 1.0;
            } else {
                this.state.status = 'damaged';
                // Evoluzione danno progressiva
                this.state.damage = Math.min(1.0, this.state.damage + (max_ratio - 1) * 0.1);
            }
        } else if (tau > this.tau_max * 0.8 || sigma > this.sigma_max * 0.8) {
            this.state.status = 'yielding';
        } else {
            this.state.status = 'elastic';
        }
        
        return this.state;
    }
    
    /**
     * Calcola le forze interne dell'elemento
     * @param {Array<number>} displacements - [u1, v1, u2, v2] in mm
     * @returns {Array<number>} Forze [F_t1, F_n1, F_t2, F_n2] in N
     */
    getInternalForces(displacements) {
        const K = this.getStiffnessMatrix();
        const forces = [0, 0, 0, 0];
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                forces[i] += K[i][j] * displacements[j];
            }
        }
        
        return forces;
    }
    
    /**
     * Resetta lo stato dell'elemento
     */
    reset() {
        this.state = {
            slip_t: 0,
            gap_n: 0,
            damage: 0,
            status: 'elastic'
        };
    }
}

// ============================================================================
// FUNZIONE HELPER: Calcolo Forze Interfaccia
// ============================================================================
/**
 * Calcola le forze tangenziali all'interfaccia spalla-profilo
 * basandosi sulla geometria e sui carichi applicati.
 * 
 * @param {Object} params - Parametri di calcolo
 * @param {number} params.appliedLoad - Carico applicato (N)
 * @param {number} params.beamLength - Lunghezza braccio (m)
 * @param {number} params.penetration - Penetrazione spalla (m)
 * @param {number} params.distanceFromWall - Distanza dal muro (m)
 * @param {string} params.loadType - Tipo carico: 'point', 'distributed', 'pulley'
 * @param {number} params.momentArm - Braccio del momento (m)
 * @returns {Object} Forze all'interfaccia
 */
function calculateInterfaceForces(params) {
    const {
        appliedLoad = 0,
        beamLength = 2,
        penetration = 0.3,
        distanceFromWall = 0.1,
        loadType = 'point',
        momentArm = null
    } = params;
    
    // Braccio del momento (default: estremità del braccio)
    const arm = momentArm !== null ? momentArm : (beamLength - distanceFromWall);
    
    // Momento all'interfaccia
    const M = appliedLoad * arm;
    
    // Forza tangenziale all'interfaccia
    // Per equilibrio: Ft = M / (penetration / 2)
    // La penetrazione è il braccio della coppia resistente
    // MIN_EFFECTIVE_ARM previene divisione per zero quando penetrazione è molto piccola
    const effectiveArm = Math.max(COUPLING_CONSTANTS.MIN_EFFECTIVE_ARM, penetration / 2);
    const Ft = M / effectiveArm;
    
    // Forza normale (reazione vincolare)
    // Approssimazione: la reazione normale è circa uguale al carico per equilibrio verticale
    const Fn = appliedLoad;
    
    // Forza risultante
    const F_resultant = Math.sqrt(Ft * Ft + Fn * Fn);
    
    // Angolo risultante
    const angle_rad = Math.atan2(Fn, Ft);
    const angle_deg = angle_rad * 180 / Math.PI;
    
    return {
        Ft: Ft,                      // N - forza tangenziale
        Fn: Fn,                      // N - forza normale
        F_resultant: F_resultant,    // N - forza risultante
        moment: M,                   // N·m - momento
        angle_deg: angle_deg,        // gradi - angolo risultante
        effectiveArm: effectiveArm,  // m - braccio effettivo
        loadType: loadType
    };
}

// ============================================================================
// ESPORTAZIONE GLOBALE (per uso in browser)
// ============================================================================
if (typeof window !== 'undefined') {
    window.CouplingAnalysis = CouplingAnalysis;
    window.InterfaceElement = InterfaceElement;
    window.ADHESIVES_DB = ADHESIVES_DB;
    window.COUPLING_CONSTANTS = COUPLING_CONSTANTS;
    window.FASTENERS_COUPLING_DB = FASTENERS_COUPLING_DB;
    window.calculateInterfaceForces = calculateInterfaceForces;
}
