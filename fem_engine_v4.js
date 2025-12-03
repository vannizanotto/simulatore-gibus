// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  FEM ENGINE v4.0 ULTRA - Simulatore Strutturale Avanzato per Gibus SpA      ║
// ║  ─────────────────────────────────────────────────────────────────────────── ║
// ║  Corotational Beam Elements | Plasticity | Contact | Fracture | Dynamics    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

'use strict';

// ============================================================================
// CONFIGURAZIONE GLOBALE v4.0
// ============================================================================
const FEM_V4_CONFIG = {
    // Solver non-lineare
    solver: {
        method: 'newton-raphson',        // 'newton-raphson', 'arc-length', 'riks'
        maxIterations: 200,
        tolerance: 1e-10,
        convergenceCriteria: 'energy',   // 'displacement', 'force', 'energy', 'all'
        lineSearchEnabled: true,
        lineSearchMaxIter: 10,
        relaxationAuto: true,
        relaxationMin: 0.1,
        relaxationMax: 1.0,
        adaptiveLoadStepping: true,
        loadStepsMin: 5,
        loadStepsMax: 50,
    },
    
    // Mesh
    mesh: {
        adaptiveEnabled: true,
        elementsMin: 50,
        elementsMax: 500,
        refinementErrorThreshold: 0.05,  // 5% errore max
        pAdaptive: true,                 // Ordine polinomiale adattivo
        maxPolynomialOrder: 4,
    },
    
    // Analisi
    analysis: {
        geometricNonlinearity: 'corotational',  // 'linear', 'updated-lagrangian', 'corotational'
        materialNonlinearity: true,
        contactAnalysis: true,
        fractureAnalysis: true,
        thermalCoupling: true,
        dynamicAnalysis: true,
        stabilityAnalysis: true,
    },
    
    // Dinamica
    dynamics: {
        method: 'newmark',               // 'newmark', 'hht-alpha', 'generalized-alpha'
        beta: 0.25,
        gamma: 0.5,
        alphaDamping: 0.05,              // Rayleigh mass
        betaDamping: 0.001,              // Rayleigh stiffness
        numModes: 10,
        timeStepAuto: true,
    },
    
    // Output
    output: {
        stressRecovery: 'superconvergent',  // 'element', 'nodal', 'superconvergent'
        errorEstimation: true,
        sensitivityAnalysis: false,
    }
};

// ============================================================================
// DATABASE MATERIALI v4.0 ULTRA - Modelli Costitutivi Completi
// ============================================================================
const MATERIALS_V4 = {
    '6060-T4': {
        // Base
        E: 68.0, G: 25.6, nu: 0.33, density: 2700, alpha: 23.1e-6,
        // Snervamento/Rottura
        yield: 65, tensile: 130, compressive: 65, shearYield: 38,
        // Ramberg-Osgood
        n_RO: 25, K_RO: 180,
        // Plasticità avanzata (Chaboche)
        Q_inf: 45, b_iso: 8, C_kin: 12000, gamma_kin: 80,
        // Danno (Lemaitre)
        S_damage: 2.5, s_damage: 1.0, epsilon_D: 0.02,
        // Fatica
        fatigue_Sf: 95, fatigue_b: -0.085, fatigue_c: -0.58, fatigue_ef: 0.25,
        // Creep (Norton-Bailey-Arrhenius)
        creep_A: 1.2e-12, creep_n: 3.5, creep_Q: 142000,
        // Frattura
        K_Ic: 24, J_Ic: 8.5,
        // Termico
        Cp: 900, k_thermal: 200, T_melt: 585, T_recryst: 340,
        name: "6060 T4"
    },
    '6060-T6': {
        E: 69.0, G: 26.0, nu: 0.33, density: 2700, alpha: 23.1e-6,
        yield: 150, tensile: 190, compressive: 150, shearYield: 87,
        n_RO: 25, K_RO: 250,
        Q_inf: 55, b_iso: 10, C_kin: 15000, gamma_kin: 100,
        S_damage: 3.0, s_damage: 1.0, epsilon_D: 0.025,
        fatigue_Sf: 140, fatigue_b: -0.08, fatigue_c: -0.55, fatigue_ef: 0.22,
        creep_A: 8e-13, creep_n: 3.5, creep_Q: 145000,
        K_Ic: 26, J_Ic: 9.5,
        Cp: 900, k_thermal: 200, T_melt: 585, T_recryst: 340,
        name: "6060 T6"
    },
    '6061-T6': {
        E: 70.0, G: 26.3, nu: 0.33, density: 2700, alpha: 23.6e-6,
        yield: 240, tensile: 290, compressive: 240, shearYield: 140,
        n_RO: 20, K_RO: 380,
        Q_inf: 75, b_iso: 12, C_kin: 20000, gamma_kin: 120,
        S_damage: 4.0, s_damage: 1.1, epsilon_D: 0.035,
        fatigue_Sf: 210, fatigue_b: -0.077, fatigue_c: -0.52, fatigue_ef: 0.20,
        creep_A: 5e-13, creep_n: 4.0, creep_Q: 150000,
        K_Ic: 29, J_Ic: 12,
        Cp: 896, k_thermal: 167, T_melt: 582, T_recryst: 340,
        name: "6061 T6"
    },
    '6082-T6': {
        E: 70.5, G: 26.5, nu: 0.33, density: 2700, alpha: 23.1e-6,
        yield: 260, tensile: 310, compressive: 260, shearYield: 150,
        n_RO: 18, K_RO: 410,
        Q_inf: 80, b_iso: 14, C_kin: 22000, gamma_kin: 130,
        S_damage: 4.5, s_damage: 1.1, epsilon_D: 0.04,
        fatigue_Sf: 230, fatigue_b: -0.075, fatigue_c: -0.50, fatigue_ef: 0.18,
        creep_A: 4e-13, creep_n: 4.2, creep_Q: 152000,
        K_Ic: 30, J_Ic: 13,
        Cp: 897, k_thermal: 180, T_melt: 555, T_recryst: 330,
        name: "6082 T6"
    },
    '7075-T6': {
        E: 71.7, G: 26.9, nu: 0.33, density: 2810, alpha: 23.4e-6,
        yield: 505, tensile: 570, compressive: 505, shearYield: 290,
        n_RO: 12, K_RO: 680,
        Q_inf: 120, b_iso: 18, C_kin: 35000, gamma_kin: 180,
        S_damage: 6.0, s_damage: 1.2, epsilon_D: 0.06,
        fatigue_Sf: 400, fatigue_b: -0.065, fatigue_c: -0.45, fatigue_ef: 0.12,
        creep_A: 2e-13, creep_n: 4.5, creep_Q: 160000,
        K_Ic: 24, J_Ic: 8,
        Cp: 960, k_thermal: 130, T_melt: 477, T_recryst: 290,
        name: "7075 T6 (Ergal)"
    },
    '2024-T3': {
        E: 73.1, G: 27.5, nu: 0.33, density: 2780, alpha: 22.9e-6,
        yield: 345, tensile: 480, compressive: 345, shearYield: 200,
        n_RO: 10, K_RO: 580,
        Q_inf: 100, b_iso: 15, C_kin: 28000, gamma_kin: 150,
        S_damage: 5.0, s_damage: 1.15, epsilon_D: 0.05,
        fatigue_Sf: 350, fatigue_b: -0.07, fatigue_c: -0.48, fatigue_ef: 0.15,
        creep_A: 3e-13, creep_n: 4.3, creep_Q: 155000,
        K_Ic: 26, J_Ic: 9,
        Cp: 875, k_thermal: 121, T_melt: 502, T_recryst: 300,
        name: "2024 T3 (Avional)"
    },
    '46100-F': {
        E: 71.0, G: 26.7, nu: 0.33, density: 2650, alpha: 21.0e-6,
        yield: 140, tensile: 240, compressive: 140, shearYield: 80,
        n_RO: 15, K_RO: 320,
        Q_inf: 50, b_iso: 8, C_kin: 12000, gamma_kin: 90,
        S_damage: 2.8, s_damage: 0.95, epsilon_D: 0.02,
        fatigue_Sf: 120, fatigue_b: -0.09, fatigue_c: -0.60, fatigue_ef: 0.28,
        creep_A: 2e-12, creep_n: 3.2, creep_Q: 135000,
        K_Ic: 18, J_Ic: 5,
        Cp: 963, k_thermal: 150, T_melt: 580, T_recryst: 320,
        name: "EN AB 46100"
    },
    '46000-F': {
        E: 72.0, G: 27.0, nu: 0.33, density: 2650, alpha: 21.0e-6,
        yield: 140, tensile: 240, compressive: 140, shearYield: 80,
        n_RO: 15, K_RO: 320,
        Q_inf: 50, b_iso: 8, C_kin: 12000, gamma_kin: 90,
        S_damage: 2.8, s_damage: 0.95, epsilon_D: 0.02,
        fatigue_Sf: 120, fatigue_b: -0.09, fatigue_c: -0.60, fatigue_ef: 0.28,
        creep_A: 2e-12, creep_n: 3.2, creep_Q: 135000,
        K_Ic: 18, J_Ic: 5,
        Cp: 963, k_thermal: 150, T_melt: 580, T_recryst: 320,
        name: "EN AB 46000"
    },
    '47100-F': {
        E: 75.0, G: 28.2, nu: 0.33, density: 2680, alpha: 20.5e-6,
        yield: 150, tensile: 260, compressive: 150, shearYield: 87,
        n_RO: 14, K_RO: 340,
        Q_inf: 55, b_iso: 9, C_kin: 14000, gamma_kin: 95,
        S_damage: 3.0, s_damage: 1.0, epsilon_D: 0.025,
        fatigue_Sf: 130, fatigue_b: -0.088, fatigue_c: -0.58, fatigue_ef: 0.26,
        creep_A: 1.8e-12, creep_n: 3.3, creep_Q: 138000,
        K_Ic: 19, J_Ic: 5.5,
        Cp: 963, k_thermal: 155, T_melt: 575, T_recryst: 315,
        name: "EN AB 47100"
    },
    'ZA-27': {
        E: 78.0, G: 29.3, nu: 0.33, density: 5000, alpha: 26.0e-6,
        yield: 370, tensile: 400, compressive: 370, shearYield: 215,
        n_RO: 8, K_RO: 500,
        Q_inf: 90, b_iso: 12, C_kin: 25000, gamma_kin: 140,
        S_damage: 4.0, s_damage: 1.0, epsilon_D: 0.03,
        fatigue_Sf: 280, fatigue_b: -0.072, fatigue_c: -0.50, fatigue_ef: 0.18,
        creep_A: 1e-12, creep_n: 3.8, creep_Q: 145000,
        K_Ic: 32, J_Ic: 14,
        Cp: 435, k_thermal: 115, T_melt: 380, T_recryst: 220,
        name: "Zamak 27"
    },
    '42100-T6': {
        E: 71.0, G: 26.7, nu: 0.33, density: 2680, alpha: 21.5e-6,
        yield: 210, tensile: 290, compressive: 210, shearYield: 120,
        n_RO: 16, K_RO: 380,
        Q_inf: 65, b_iso: 11, C_kin: 18000, gamma_kin: 110,
        S_damage: 3.5, s_damage: 1.05, epsilon_D: 0.03,
        fatigue_Sf: 180, fatigue_b: -0.078, fatigue_c: -0.53, fatigue_ef: 0.21,
        creep_A: 6e-13, creep_n: 3.9, creep_Q: 148000,
        K_Ic: 25, J_Ic: 9,
        Cp: 963, k_thermal: 160, T_melt: 555, T_recryst: 320,
        name: "EN AB 42100 T6"
    },
    '6082-CNC': {
        E: 70.0, G: 26.3, nu: 0.33, density: 2700, alpha: 23.1e-6,
        yield: 260, tensile: 310, compressive: 260, shearYield: 150,
        n_RO: 18, K_RO: 410,
        Q_inf: 80, b_iso: 14, C_kin: 22000, gamma_kin: 130,
        S_damage: 4.5, s_damage: 1.1, epsilon_D: 0.04,
        fatigue_Sf: 230, fatigue_b: -0.075, fatigue_c: -0.50, fatigue_ef: 0.18,
        creep_A: 4e-13, creep_n: 4.2, creep_Q: 152000,
        K_Ic: 30, J_Ic: 13,
        Cp: 897, k_thermal: 180, T_melt: 555, T_recryst: 330,
        name: "6082 T6 (CNC)"
    },
    '7075-CNC': {
        E: 71.7, G: 26.9, nu: 0.33, density: 2810, alpha: 23.4e-6,
        yield: 500, tensile: 570, compressive: 500, shearYield: 290,
        n_RO: 12, K_RO: 680,
        Q_inf: 120, b_iso: 18, C_kin: 35000, gamma_kin: 180,
        S_damage: 6.0, s_damage: 1.2, epsilon_D: 0.06,
        fatigue_Sf: 395, fatigue_b: -0.066, fatigue_c: -0.46, fatigue_ef: 0.13,
        creep_A: 2e-13, creep_n: 4.5, creep_Q: 160000,
        K_Ic: 24, J_Ic: 8,
        Cp: 960, k_thermal: 130, T_melt: 477, T_recryst: 290,
        name: "7075 T6 (CNC)"
    },
    '6063-T6': {
        E: 69.5, G: 26.1, nu: 0.33, density: 2700, alpha: 23.4e-6,
        yield: 170, tensile: 215, compressive: 170, shearYield: 98,
        n_RO: 22, K_RO: 290,
        Q_inf: 60, b_iso: 10, C_kin: 16000, gamma_kin: 100,
        S_damage: 3.2, s_damage: 1.0, epsilon_D: 0.028,
        fatigue_Sf: 160, fatigue_b: -0.08, fatigue_c: -0.55, fatigue_ef: 0.22,
        creep_A: 7e-13, creep_n: 3.7, creep_Q: 147000,
        K_Ic: 27, J_Ic: 10,
        Cp: 900, k_thermal: 201, T_melt: 615, T_recryst: 350,
        name: "6063 T6"
    },
    '6061-T4': {
        E: 68.3, G: 25.7, nu: 0.33, density: 2700, alpha: 23.6e-6,
        yield: 110, tensile: 205, compressive: 110, shearYield: 64,
        n_RO: 22, K_RO: 280,
        Q_inf: 55, b_iso: 9, C_kin: 14000, gamma_kin: 95,
        S_damage: 2.8, s_damage: 0.95, epsilon_D: 0.022,
        fatigue_Sf: 150, fatigue_b: -0.082, fatigue_c: -0.56, fatigue_ef: 0.24,
        creep_A: 9e-13, creep_n: 3.6, creep_Q: 144000,
        K_Ic: 28, J_Ic: 11,
        Cp: 896, k_thermal: 167, T_melt: 582, T_recryst: 340,
        name: "6061 T4"
    }
};

// ============================================================================
// COSTANTI FISICHE
// ============================================================================
const PHYSICS_V4 = {
    g: 9.80665,
    R_gas: 8.314,
    airDensity: 1.225,
    stefan_boltzmann: 5.670374419e-8,
    kelvin_offset: 273.15,
    reference_temp: 20,
};

// ============================================================================
// COSTANTI EUROCODICE 9 (EC9) - COLLEGAMENTI ALLUMINIO
// ============================================================================
const EC9_CONSTANTS = {
    // Coefficienti parziali di sicurezza
    gamma_M0: 1.10,  // Resistenza sezioni
    gamma_M1: 1.10,  // Resistenza instabilità
    gamma_M2: 1.25,  // Resistenza collegamenti
    
    // Fattori k1 per bearing
    k1_edge: 2.5,    // Bullone al bordo
    k1_inner: 2.5,   // Bullone interno
    
    // Distanze minime fori (in diametri del bullone)
    e1_min: 1.2,     // Dal bordo, direzione carico
    e2_min: 1.2,     // Dal bordo, perpendicolare al carico
    p1_min: 2.2,     // Tra fori, direzione carico
    p2_min: 2.4,     // Tra fori, perpendicolare al carico
    
    // Distanze massime fori
    e1_max_factor: 12,   // e1 ≤ 12*t (t = spessore minore)
    p1_max_factor: 14,   // p1 ≤ 14*t
};

// ============================================================================
// COSTANTI INGEGNERISTICHE PER ANALISI FORI
// ============================================================================
const HOLE_ANALYSIS_CONSTANTS = {
    // Fattore Kt minimo (vincolo fisico: Kt non può essere < 1)
    MIN_KT_VALUE: 1.0,
    
    // Kt massimo per foro in piastra infinita (caso limite)
    MAX_KT_VALUE: 3.0,
    
    // Rapporto d/W massimo per validità formula Peterson
    MAX_D_W_RATIO: 0.5,
    
    // Costante sensibilità intaglio di default per materiali non in tabella
    DEFAULT_NOTCH_CONSTANT_A: 0.25,
    
    // Raggio minimo intaglio per evitare divisione per zero (mm)
    MIN_NOTCH_RADIUS: 0.1,
    
    // Fattore limite fatica per alluminio (σ_e ≈ 0.4 × σ_u)
    ALUMINUM_FATIGUE_LIMIT_FACTOR: 0.4,
};

// ============================================================================
// COSTANTI PETERSON - SENSIBILITÀ ALL'INTAGLIO ALLUMINIO
// ============================================================================
const NOTCH_CONSTANTS = {
    '6060-T4': { a: 0.30, description: '6060 T4 - Bassa resistenza' },
    '6060-T6': { a: 0.25, description: '6060 T6 - Medio-bassa resistenza' },
    '6061-T4': { a: 0.28, description: '6061 T4 - Media resistenza' },
    '6061-T6': { a: 0.20, description: '6061 T6 - Strutturale' },
    '6063-T6': { a: 0.24, description: '6063 T6 - Estruso' },
    '6082-T6': { a: 0.18, description: '6082 T6 - Alta resistenza' },
    '7075-T6': { a: 0.10, description: '7075 T6 - Ergal alta resistenza' },
    '2024-T3': { a: 0.12, description: '2024 T3 - Avional' },
    '46100-F': { a: 0.35, description: 'Pressofusione EN AB-46100' },
    '46000-F': { a: 0.35, description: 'Pressofusione EN AB-46000' },
    '47100-F': { a: 0.32, description: 'Pressofusione EN AB-47100' },
    'ZA-27':   { a: 0.15, description: 'Zamak 27' },
    '42100-T6': { a: 0.22, description: 'Conchiglia EN AB-42100 T6' },
    '6082-CNC': { a: 0.18, description: '6082 T6 CNC' },
    '7075-CNC': { a: 0.10, description: '7075 T6 CNC' },
};

// ============================================================================
// CLASSE HoleStressAnalysis - ANALISI LOCALE FORO (Peterson/Frocht)
// ============================================================================
/**
 * Analisi dettagliata della zona forata per concentrazione tensioni
 * Implementa formule di Peterson per foro singolo e correzione Frocht per fori multipli
 */
class HoleStressAnalysis {
    /**
     * @param {Object} params - Parametri del foro
     * @param {number} params.d - Diametro foro (mm)
     * @param {number} params.p - Passo tra fori (mm)
     * @param {number} params.t - Spessore piastra (mm)
     * @param {number} params.W - Larghezza piastra (mm)
     * @param {number} params.n - Numero fori
     * @param {string} params.material - Chiave materiale (es. '6061-T6')
     */
    constructor(params) {
        this.holeDiameter = params.d || 0;      // mm
        this.holeSpacing = params.p || 50;      // passo tra fori, mm
        this.plateThickness = params.t || 3;    // spessore piastra, mm
        this.plateWidth = params.W || 33;       // larghezza piastra, mm
        this.numHoles = params.n || 1;          // numero fori
        this.materialKey = params.material || '6061-T6';
    }
    
    /**
     * Calcola Kt secondo Peterson per foro singolo in piastra finita
     * Formula: Kt = 3.0 - 3.14(d/W) + 3.667(d/W)² - 1.527(d/W)³
     * @returns {number} Fattore di concentrazione tensioni Kt
     */
    calculateKt_Peterson() {
        if (this.plateWidth <= 0 || this.holeDiameter <= 0) {
            return HOLE_ANALYSIS_CONSTANTS.MIN_KT_VALUE;
        }
        
        const ratio = this.holeDiameter / this.plateWidth;
        
        // Limite rapporto d/W per validità formula
        if (ratio >= HOLE_ANALYSIS_CONSTANTS.MAX_D_W_RATIO) {
            return HOLE_ANALYSIS_CONSTANTS.MAX_KT_VALUE;
        }
        
        const Kt = 3.0 
                   - 3.14 * ratio 
                   + 3.667 * Math.pow(ratio, 2) 
                   - 1.527 * Math.pow(ratio, 3);
        
        return Math.max(HOLE_ANALYSIS_CONSTANTS.MIN_KT_VALUE, Kt);
    }
    
    /**
     * Calcola correzione Kt per interazione fori multipli (Frocht)
     * Per p/d > 2: Kt_multi = Kt × [1 + 0.5(d/p)²]
     * Per p/d ≤ 2: Kt_multi = Kt × [1 + 0.3(d/p)]
     * @returns {number} Fattore di concentrazione tensioni corretto per fori multipli
     */
    calculateKt_MultiHole() {
        if (this.numHoles <= 1) {
            return this.calculateKt_Peterson();
        }
        
        const Kt_single = this.calculateKt_Peterson();
        
        if (this.holeSpacing <= 0 || this.holeDiameter <= 0) {
            return Kt_single;
        }
        
        const p_d_ratio = this.holeSpacing / this.holeDiameter;
        const d_p_ratio = this.holeDiameter / this.holeSpacing;
        
        let correctionFactor;
        if (p_d_ratio > 2) {
            // Fori distanti: effetto quadratico ridotto
            correctionFactor = 1 + 0.5 * Math.pow(d_p_ratio, 2);
        } else {
            // Fori vicini: effetto lineare più pronunciato
            correctionFactor = 1 + 0.3 * d_p_ratio;
        }
        
        return Kt_single * correctionFactor;
    }
    
    /**
     * Restituisce il Kt effettivo combinato
     * @returns {number} Fattore Kt effettivo
     */
    getEffectiveKt() {
        return this.calculateKt_MultiHole();
    }
    
    /**
     * Calcola la tensione massima locale attorno al foro
     * @param {number} sigma_nominal - Tensione nominale (MPa)
     * @returns {number} Tensione massima locale (MPa)
     */
    getMaxLocalStress(sigma_nominal) {
        return sigma_nominal * this.getEffectiveKt();
    }
    
    /**
     * Verifica distanze minime EC9
     * @returns {Object} Risultato verifica distanze
     */
    checkEC9Distances() {
        const d0 = this.holeDiameter; // Diametro foro nominale
        
        const results = {
            p1_required: EC9_CONSTANTS.p1_min * d0,
            p1_actual: this.holeSpacing,
            p1_ok: this.holeSpacing >= EC9_CONSTANTS.p1_min * d0,
            spacing_ratio: this.holeSpacing / d0
        };
        
        return results;
    }
}

// ============================================================================
// CLASSE NetSectionAnalysis - SEZIONE NETTA (EC9)
// ============================================================================
/**
 * Calcolo della sezione netta secondo Eurocodice 9
 * Implementa A_net, I_net e tensioni sulla sezione netta
 */
class NetSectionAnalysis {
    /**
     * @param {Object} section - Sezione lorda (BeamSection o BeamSectionWithHoles)
     * @param {Object} holes - Configurazione fori
     * @param {number} holes.n - Numero fori
     * @param {number} holes.d - Diametro foro (mm)
     * @param {number} holes.y - Posizione Y dei fori rispetto all'asse neutro (mm)
     * @param {number} holes.t - Spessore nella zona forata (mm)
     */
    constructor(section, holes) {
        this.grossSection = section;
        this.holes = holes || { n: 0, d: 0, y: 0, t: 0 };
    }
    
    /**
     * Calcola l'area netta: A_net = A_gross - Σ(n × d × t)
     * @returns {number} Area netta (m²)
     */
    calculateNetArea() {
        if (this.holes.n === 0 || this.holes.d === 0) {
            return this.grossSection.A;
        }
        
        const n = this.holes.n;
        const d_m = this.holes.d / 1000; // mm -> m
        const t_m = this.holes.t / 1000; // mm -> m
        
        // Riduzione area: n × d × t (area rettangolare dei fori)
        const areaReduction = n * d_m * t_m;
        
        return Math.max(1e-8, this.grossSection.A - areaReduction);
    }
    
    /**
     * Calcola l'inerzia netta con teorema di Steiner esatto
     * ΔI = Σ(A_foro × y² + I_locale_foro)
     * @returns {number} Inerzia netta (m⁴)
     */
    calculateNetInertia() {
        if (this.holes.n === 0 || this.holes.d === 0) {
            return this.grossSection.I;
        }
        
        const n = this.holes.n;
        const d_m = this.holes.d / 1000; // mm -> m
        const t_m = this.holes.t / 1000; // mm -> m
        const y_m = this.holes.y / 1000; // mm -> m (distanza dall'asse neutro)
        
        // Area singolo foro (approssimato come rettangolo d × t)
        const holeArea = d_m * t_m;
        
        // Inerzia locale del foro (circa π×d⁴/64 per foro circolare)
        const holeLocalInertia = (Math.PI * Math.pow(d_m, 4)) / 64;
        
        // Contributo Steiner: A × y²
        const steinerContribution = holeArea * Math.pow(y_m, 2);
        
        // Riduzione totale inerzia per tutti i fori
        const inertiaReduction = n * (holeLocalInertia + steinerContribution);
        
        return Math.max(1e-14, this.grossSection.I - inertiaReduction);
    }
    
    /**
     * Calcola il modulo di resistenza netto
     * W_net = I_net / y_max
     * @returns {number} Modulo di resistenza netto (m³)
     */
    calculateNetSectionModulus() {
        const I_net = this.calculateNetInertia();
        const y_max = this.grossSection.H / 2; // Distanza massima dall'asse neutro
        
        return I_net / y_max;
    }
    
    /**
     * Calcola la tensione sulla sezione netta
     * σ_net = N/A_net + M×y/I_net
     * @param {number} M - Momento flettente (N·m)
     * @param {number} N - Forza assiale (N), positiva a trazione
     * @returns {Object} Tensioni sulla sezione netta
     */
    calculateNetStress(M, N = 0) {
        const A_net = this.calculateNetArea();
        const I_net = this.calculateNetInertia();
        const y_max = this.grossSection.H / 2;
        
        const sigma_axial = N / A_net;
        const sigma_bending = (M * y_max) / I_net;
        
        return {
            sigma_axial: sigma_axial / 1e6,      // MPa
            sigma_bending: sigma_bending / 1e6,  // MPa
            sigma_total: (sigma_axial + sigma_bending) / 1e6, // MPa
            A_net: A_net,
            I_net: I_net
        };
    }
}

// ============================================================================
// CLASSE BearingAnalysis - VERIFICA RIFOLLAMENTO (EC9)
// ============================================================================
/**
 * Verifica della resistenza a rifollamento (bearing) secondo Eurocodice 9
 * F_b,Rd = k1 × α_b × f_u × d × t / γ_M2
 */
class BearingAnalysis {
    /**
     * @param {Object} fastener - Dati del fissaggio
     * @param {number} fastener.diameter - Diametro nominale (mm)
     * @param {number} fastener.f_ub - Resistenza a trazione del bullone (MPa)
     * @param {Object} plate - Dati della piastra
     * @param {number} plate.thickness - Spessore (mm)
     * @param {number} plate.e1 - Distanza dal bordo, direzione carico (mm)
     * @param {number} plate.p1 - Passo tra fori, direzione carico (mm)
     * @param {Object} material - Materiale piastra (da MATERIALS_V4)
     */
    constructor(fastener, plate, material) {
        this.d = fastener.diameter || 4;        // mm
        this.d0 = this.d + 0.5;                 // Diametro foro (d + gioco)
        this.f_ub = fastener.f_ub || 400;       // MPa
        this.t = plate.thickness || 3;          // mm
        this.e1 = plate.e1 || 15;               // mm
        this.p1 = plate.p1 || 30;               // mm
        this.material = material;
    }
    
    /**
     * Calcola il coefficiente α_b secondo EC9
     * α_b = min(e1/3d₀, p1/3d₀ - 1/4, f_ub/f_u, 1.0)
     * @returns {number} Coefficiente α_b
     */
    calculateAlpha_b() {
        const f_u = this.material.tensile; // MPa
        
        const alpha_e1 = this.e1 / (3 * this.d0);
        const alpha_p1 = (this.p1 / (3 * this.d0)) - 0.25;
        const alpha_fub = this.f_ub / f_u;
        
        return Math.min(alpha_e1, alpha_p1, alpha_fub, 1.0);
    }
    
    /**
     * Calcola la resistenza a bearing secondo EC9
     * F_b,Rd = k1 × α_b × f_u × d × t / γ_M2
     * @returns {number} Resistenza a bearing (N)
     */
    calculateBearingResistance() {
        const k1 = EC9_CONSTANTS.k1_inner;
        const alpha_b = this.calculateAlpha_b();
        const f_u = this.material.tensile * 1e6; // MPa -> Pa
        const d_m = this.d / 1000;  // mm -> m
        const t_m = this.t / 1000;  // mm -> m
        const gamma_M2 = EC9_CONSTANTS.gamma_M2;
        
        const F_b_Rd = (k1 * alpha_b * f_u * d_m * t_m) / gamma_M2;
        
        return F_b_Rd; // Newton
    }
    
    /**
     * Verifica a bearing
     * @param {number} appliedForce - Forza applicata per bullone (N)
     * @returns {Object} Risultato verifica
     */
    checkBearing(appliedForce) {
        const F_b_Rd = this.calculateBearingResistance();
        const utilization = appliedForce / F_b_Rd;
        
        return {
            F_b_Rd: F_b_Rd,
            F_Ed: appliedForce,
            utilization: utilization,
            utilizationPercent: utilization * 100,
            status: utilization <= 1.0 ? 'OK' : 'CRITICO',
            alpha_b: this.calculateAlpha_b()
        };
    }
}

// ============================================================================
// CLASSE FatigueNotchAnalysis - FATTORE FATICA PETERSON
// ============================================================================
/**
 * Calcola il fattore di fatica considerando la sensibilità all'intaglio
 * Basato sulla teoria di Peterson
 */
class FatigueNotchAnalysis {
    /**
     * @param {string} materialKey - Chiave materiale (es. '6061-T6')
     * @param {number} Kt - Fattore di concentrazione tensioni teorico
     * @param {number} notchRadius - Raggio di raccordo dell'intaglio (mm)
     */
    constructor(materialKey, Kt, notchRadius) {
        this.materialKey = materialKey || '6061-T6';
        this.Kt = Kt || 1.0;
        this.r = notchRadius || 0.5; // mm, raggio minimo tipico per fori
    }
    
    /**
     * Ottiene la costante del materiale 'a' dalla tabella
     * @returns {number} Costante materiale a (mm)
     */
    getMaterialConstant() {
        const notchData = NOTCH_CONSTANTS[this.materialKey];
        if (notchData) {
            return notchData.a;
        }
        // Default per materiali non in tabella
        return HOLE_ANALYSIS_CONSTANTS.DEFAULT_NOTCH_CONSTANT_A;
    }
    
    /**
     * Calcola la sensibilità all'intaglio (Peterson)
     * q = 1 / (1 + a/r)
     * dove a = costante materiale, r = raggio intaglio
     * @returns {number} Sensibilità all'intaglio q (0 ≤ q ≤ 1)
     */
    calculateNotchSensitivity() {
        const a = this.getMaterialConstant();
        const r = Math.max(HOLE_ANALYSIS_CONSTANTS.MIN_NOTCH_RADIUS, this.r);
        
        const q = 1 / (1 + a / r);
        
        return Math.max(0, Math.min(1, q));
    }
    
    /**
     * Calcola il fattore di fatica effettivo (Kf)
     * Kf = 1 + q × (Kt - 1)
     * @returns {number} Fattore di fatica Kf
     */
    calculateKf() {
        const q = this.calculateNotchSensitivity();
        const Kf = 1 + q * (this.Kt - 1);
        
        return Math.max(HOLE_ANALYSIS_CONSTANTS.MIN_KT_VALUE, Kf);
    }
    
    /**
     * Calcola il fattore di sicurezza a fatica
     * @param {number} sigma_a - Ampiezza tensione alternata (MPa)
     * @param {number} sigma_m - Tensione media (MPa)
     * @returns {Object} Risultato analisi fatica
     */
    calculateFatigueSafetyFactor(sigma_a, sigma_m = 0) {
        const Kf = this.calculateKf();
        const material = MATERIALS_V4[this.materialKey];
        
        if (!material) {
            return { safetyFactor: 1.0, status: 'UNKNOWN' };
        }
        
        // Limite di fatica approssimato (circa 0.4 × σ_u per alluminio)
        const Se = material.fatigue_Sf || 
                   (material.tensile * HOLE_ANALYSIS_CONSTANTS.ALUMINUM_FATIGUE_LIMIT_FACTOR);
        const Su = material.tensile;
        
        // Criterio di Goodman modificato
        // σ_a/Se + σ_m/Su = 1/n
        const sigma_a_eff = sigma_a * Kf;
        
        if (sigma_a_eff <= 0 && sigma_m <= 0) {
            return { safetyFactor: Infinity, status: 'OK' };
        }
        
        const n = 1 / ((sigma_a_eff / Se) + (Math.abs(sigma_m) / Su));
        
        return {
            safetyFactor: n,
            Kf: Kf,
            q: this.calculateNotchSensitivity(),
            sigma_a_effective: sigma_a_eff,
            status: n >= 1.5 ? 'OK' : (n >= 1.0 ? 'ATTENZIONE' : 'CRITICO')
        };
    }
}

// ============================================================================
// CLASSE AdvancedHoleFEM - MESH LOCALE RAFFINATA (Opzionale)
// ============================================================================
/**
 * Mesh 2D raffinata attorno al foro per calcolo tensioni locali
 * Implementazione semplificata con elementi quadrilateri a 4 nodi
 */
class AdvancedHoleFEM {
    /**
     * @param {Object} holeParams - Parametri del foro
     * @param {number} holeParams.d - Diametro foro (mm)
     * @param {number} holeParams.t - Spessore piastra (mm)
     * @param {number} holeParams.W - Larghezza zona analizzata (mm)
     * @param {number} holeParams.H - Altezza zona analizzata (mm)
     * @param {number} holeParams.E - Modulo elastico (GPa)
     * @param {number} holeParams.nu - Coefficiente di Poisson
     */
    constructor(holeParams) {
        this.d = holeParams.d || 4;           // mm
        this.t = holeParams.t || 3;           // mm
        this.W = holeParams.W || 20;          // mm
        this.H = holeParams.H || 20;          // mm
        this.E = (holeParams.E || 70) * 1e3;  // GPa -> MPa
        this.nu = holeParams.nu || 0.33;
        
        this.nodes = [];
        this.elements = [];
        this.stresses = [];
    }
    
    /**
     * Genera mesh raffinata attorno al foro (8-16 elementi)
     * Schema: elementi radiali attorno al foro + elementi rettangolari esterni
     * @returns {Object} Mesh generata con nodi ed elementi
     */
    generateLocalMesh() {
        const r = this.d / 2;
        const numRadial = 8;  // Elementi attorno al foro
        const numLayers = 2;  // Strati radiali
        
        this.nodes = [];
        this.elements = [];
        
        // Genera nodi sul bordo del foro e strati esterni
        for (let layer = 0; layer <= numLayers; layer++) {
            const radius = r * (1 + layer * 0.5); // Raggio crescente
            
            for (let i = 0; i < numRadial; i++) {
                const angle = (2 * Math.PI * i) / numRadial;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                
                this.nodes.push({
                    id: layer * numRadial + i,
                    x: x,
                    y: y,
                    layer: layer,
                    angle: angle
                });
            }
        }
        
        // Genera elementi quadrilateri tra gli strati
        for (let layer = 0; layer < numLayers; layer++) {
            for (let i = 0; i < numRadial; i++) {
                const n1 = layer * numRadial + i;
                const n2 = layer * numRadial + ((i + 1) % numRadial);
                const n3 = (layer + 1) * numRadial + ((i + 1) % numRadial);
                const n4 = (layer + 1) * numRadial + i;
                
                this.elements.push({
                    id: layer * numRadial + i,
                    nodes: [n1, n2, n3, n4],
                    layer: layer
                });
            }
        }
        
        return {
            nodes: this.nodes,
            elements: this.elements,
            numNodes: this.nodes.length,
            numElements: this.elements.length
        };
    }
    
    /**
     * Risolve problema elastico locale con tensione applicata al bordo
     * Soluzione analitica di Kirsch per foro circolare in piastra infinita
     * @param {number} boundaryStress - Tensione nominale applicata (MPa)
     * @returns {Array} Campo di tensioni negli elementi
     */
    solveLocalProblem(boundaryStress) {
        const sigma_inf = boundaryStress;
        const a = this.d / 2; // Raggio foro
        
        this.stresses = [];
        
        // Soluzione di Kirsch per ogni elemento
        for (const elem of this.elements) {
            // Centro dell'elemento
            const nodeIds = elem.nodes;
            let cx = 0, cy = 0;
            for (const nid of nodeIds) {
                cx += this.nodes[nid].x;
                cy += this.nodes[nid].y;
            }
            cx /= 4;
            cy /= 4;
            
            const r = Math.sqrt(cx * cx + cy * cy);
            const theta = Math.atan2(cy, cx);
            
            // Tensioni Kirsch (coordinate polari)
            const a2_r2 = Math.pow(a / r, 2);
            const a4_r4 = Math.pow(a / r, 4);
            
            // σ_r (radiale)
            const sigma_r = (sigma_inf / 2) * (1 - a2_r2) + 
                           (sigma_inf / 2) * (1 - 4 * a2_r2 + 3 * a4_r4) * Math.cos(2 * theta);
            
            // σ_θ (tangenziale)
            const sigma_theta = (sigma_inf / 2) * (1 + a2_r2) - 
                               (sigma_inf / 2) * (1 + 3 * a4_r4) * Math.cos(2 * theta);
            
            // τ_rθ (taglio)
            const tau_r_theta = -(sigma_inf / 2) * (1 + 2 * a2_r2 - 3 * a4_r4) * Math.sin(2 * theta);
            
            // Tensione principale massima
            const sigma_avg = (sigma_r + sigma_theta) / 2;
            const R = Math.sqrt(Math.pow((sigma_r - sigma_theta) / 2, 2) + Math.pow(tau_r_theta, 2));
            const sigma_1 = sigma_avg + R;
            const sigma_2 = sigma_avg - R;
            
            // Von Mises
            const sigma_vm = Math.sqrt(sigma_1 * sigma_1 - sigma_1 * sigma_2 + sigma_2 * sigma_2);
            
            this.stresses.push({
                elementId: elem.id,
                r: r,
                theta: theta,
                sigma_r: sigma_r,
                sigma_theta: sigma_theta,
                tau_r_theta: tau_r_theta,
                sigma_1: sigma_1,
                sigma_2: sigma_2,
                sigma_vonMises: sigma_vm
            });
        }
        
        return this.stresses;
    }
    
    /**
     * Estrae la tensione principale massima dalla soluzione
     * @returns {Object} Tensione massima e sua posizione
     */
    getMaxPrincipalStress() {
        if (this.stresses.length === 0) {
            return { maxStress: 0, location: null };
        }
        
        let maxStress = 0;
        let maxElement = null;
        
        for (const stress of this.stresses) {
            if (stress.sigma_1 > maxStress) {
                maxStress = stress.sigma_1;
                maxElement = stress;
            }
        }
        
        return {
            maxStress: maxStress,
            maxVonMises: maxElement ? maxElement.sigma_vonMises : 0,
            location: maxElement ? { r: maxElement.r, theta: maxElement.theta } : null,
            Kt_computed: maxStress / (this.stresses[0] ? this.stresses[this.stresses.length - 1].sigma_theta : 1)
        };
    }
}

// ============================================================================
// ALGEBRA LINEARE AVANZATA
// ============================================================================
class Matrix {
    constructor(rows, cols, data = null) {
        this.rows = rows;
        this.cols = cols;
        this.data = data || new Float64Array(rows * cols);
    }
    
    static zeros(rows, cols) { return new Matrix(rows, cols); }
    static identity(n) {
        const m = new Matrix(n, n);
        for (let i = 0; i < n; i++) m.set(i, i, 1);
        return m;
    }
    
    get(i, j) { return this.data[i * this.cols + j]; }
    set(i, j, v) { this.data[i * this. cols + j] = v; }
    
    add(other) {
        const result = new Matrix(this.rows, this. cols);
        for (let i = 0; i < this.data.length; i++) {
            result. data[i] = this.data[i] + other.data[i];
        }
        return result;
    }
    
    scale(s) {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.data.length; i++) {
            result. data[i] = this.data[i] * s;
        }
        return result;
    }
    
    multiply(other) {
        if (other instanceof Matrix) {
            const result = new Matrix(this.rows, other.cols);
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < other.cols; j++) {
                    let sum = 0;
                    for (let k = 0; k < this. cols; k++) {
                        sum += this.get(i, k) * other.get(k, j);
                    }
                    result.set(i, j, sum);
                }
            }
            return result;
        } else {
            // Vector multiplication
            const result = new Float64Array(this. rows);
            for (let i = 0; i < this.rows; i++) {
                let sum = 0;
                for (let j = 0; j < this.cols; j++) {
                    sum += this.get(i, j) * other[j];
                }
                result[i] = sum;
            }
            return result;
        }
    }
    
    transpose() {
        const result = new Matrix(this.cols, this.rows);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.set(j, i, this. get(i, j));
            }
        }
        return result;
    }
    
    // Cholesky decomposition for SPD matrices
    cholesky() {
        const n = this.rows;
        const L = Matrix.zeros(n, n);
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L.get(i, k) * L. get(j, k);
                }
                if (i === j) {
                    L.set(i, j, Math.sqrt(Math.max(1e-15, this.get(i, i) - sum)));
                } else {
                    const Ljj = L.get(j, j);
                    L.set(i, j, Ljj > 1e-15 ?  (this.get(i, j) - sum) / Ljj : 0);
                }
            }
        }
        return L;
    }
    
    // Solve Ax = b using Cholesky
    solve(b) {
        const L = this.cholesky();
        const n = this.rows;
        
        // Forward substitution: Ly = b
        const y = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            let sum = b[i];
            for (let j = 0; j < i; j++) {
                sum -= L. get(i, j) * y[j];
            }
            const Lii = L.get(i, i);
            y[i] = Lii > 1e-15 ?  sum / Lii : 0;
        }
        
        // Backward substitution: L'x = y
        const x = new Float64Array(n);
        for (let i = n - 1; i >= 0; i--) {
            let sum = y[i];
            for (let j = i + 1; j < n; j++) {
                sum -= L.get(j, i) * x[j];
            }
            const Lii = L. get(i, i);
            x[i] = Lii > 1e-15 ? sum / Lii : 0;
        }
        
        return x;
    }
    
    // Eigenvalue analysis (Power iteration for dominant eigenvalue)
    dominantEigenvalue(maxIter = 100, tol = 1e-10) {
        const n = this.rows;
        let v = new Float64Array(n);
        for (let i = 0; i < n; i++) v[i] = 1 / Math.sqrt(n);
        
        let lambda = 0;
        for (let iter = 0; iter < maxIter; iter++) {
            const w = this.multiply(v);
            const lambdaNew = Math.sqrt(w. reduce((s, x) => s + x * x, 0));
            
            if (Math. abs(lambdaNew - lambda) < tol) {
                return { eigenvalue: lambdaNew, eigenvector: v, converged: true };
            }
            
            lambda = lambdaNew;
            for (let i = 0; i < n; i++) v[i] = lambdaNew > 1e-15 ? w[i] / lambdaNew : 0;
        }
        
        return { eigenvalue: lambda, eigenvector: v, converged: false };
    }
    
    norm() {
        return Math.sqrt(this.data.reduce((s, x) => s + x * x, 0));
    }
}

// ============================================================================
// MODELLO COSTITUTIVO: Plasticità Combinata Isotropa-Cinematica (Chaboche)
// ============================================================================
class ChabochePlasticity {
    constructor(material) {
        this. E = material.E * 1e9;
        this. sigma_y0 = material.yield * 1e6;
        this.Q_inf = (material.Q_inf || 50) * 1e6;
        this. b = material.b_iso || 10;
        this. C = (material.C_kin || 15000) * 1e6;
        this.gamma = material.gamma_kin || 100;
        
        // State variables
        this. epsilon_p = 0;          // Plastic strain
        this.alpha = 0;              // Backstress (kinematic)
        this.r = 0;                  // Isotropic hardening variable
        this.damage = 0;             // Damage variable (Lemaitre)
        
        // Damage parameters
        this.S_damage = material.S_damage || 3;
        this.s_damage = material. s_damage || 1;
        this.epsilon_D = material. epsilon_D || 0.03;
    }
    
    // Yield function with combined hardening
    yieldFunction(sigma, alpha, R) {
        const sigma_eff = sigma - alpha;  // Effective stress
        const sigma_y = this.sigma_y0 + R;
        return Math.abs(sigma_eff) - sigma_y;
    }
    
    // Isotropic hardening
    isotropicHardening(r) {
        return this.Q_inf * (1 - Math.exp(-this.b * r));
    }
    
    // Update stress with return mapping algorithm
    update(epsilon_total, temperature = 20) {
        // Temperature correction
        const T_factor = 1 - 0.0015 * Math.max(0, temperature - 20);
        const sigma_y_T = this.sigma_y0 * Math.max(0.5, T_factor);
        const E_T = this. E * (1 - 0.0004 * Math.max(0, temperature - 20));
        
        // Trial stress
        const epsilon_e_trial = epsilon_total - this.epsilon_p;
        const sigma_trial = E_T * epsilon_e_trial * (1 - this. damage);
        
        // Check yield
        const R = this.isotropicHardening(this.r);
        const f_trial = this.yieldFunction(sigma_trial, this.alpha, R);
        
        if (f_trial <= 0) {
            // Elastic
            return {
                stress: sigma_trial,
                tangent: E_T * (1 - this.damage),
                plastic: false,
                damage: this.damage
            };
        }
        
        // Plastic - Return mapping
        const sign_stress = sigma_trial - this.alpha >= 0 ? 1 : -1;
        
        // Newton iteration for plastic multiplier
        let delta_gamma = 0;
        for (let iter = 0; iter < 20; iter++) {
            const R_new = this. isotropicHardening(this.r + delta_gamma);
            const alpha_new = this. alpha + this.C / this.gamma * (1 - Math.exp(-this. gamma * delta_gamma)) * sign_stress;
            
            const sigma_new = sigma_trial - E_T * delta_gamma * sign_stress * (1 - this.damage);
            const f = Math.abs(sigma_new - alpha_new) - (sigma_y_T + R_new);
            
            if (Math.abs(f) < 1e-10) break;
            
            // Derivative
            const df_dgamma = -E_T * (1 - this. damage) - this.C * Math.exp(-this. gamma * delta_gamma) - this.Q_inf * this.b * Math.exp(-this. b * (this.r + delta_gamma));
            delta_gamma -= f / df_dgamma;
            delta_gamma = Math. max(0, delta_gamma);
        }
        
        // Update state
        this.epsilon_p += delta_gamma * sign_stress;
        this.alpha += this.C / this. gamma * (1 - Math.exp(-this.gamma * delta_gamma)) * sign_stress;
        this.r += delta_gamma;
        
        // Damage evolution (Lemaitre)
        if (this.r > this.epsilon_D) {
            const Y = 0.5 * sigma_trial * sigma_trial / E_T;  // Energy release rate
            const damage_increment = Math.pow(Y / this.S_damage, this.s_damage) * delta_gamma;
            this.damage = Math.min(0.99, this.damage + damage_increment);
        }
        
        const sigma_final = (sigma_trial - E_T * delta_gamma * sign_stress) * (1 - this.damage);
        
        // Consistent tangent modulus
        const H_iso = this.Q_inf * this. b * Math.exp(-this.b * this.r);
        const H_kin = this.C * Math. exp(-this.gamma * delta_gamma);
        const E_tan = E_T * (H_iso + H_kin) / (E_T + H_iso + H_kin) * (1 - this. damage);
        
        return {
            stress: sigma_final,
            tangent: Math.max(E_T * 0.01, E_tan),
            plastic: true,
            damage: this.damage,
            plastic_strain: this.epsilon_p
        };
    }
    
    reset() {
        this.epsilon_p = 0;
        this.alpha = 0;
        this.r = 0;
        this. damage = 0;
    }
}

// ============================================================================
// ELEMENTO TRAVE COROTAZIONALE (Geometricamente Esatto)
// ============================================================================
class CorotationalBeamElement {
    constructor(nodeI, nodeJ, material, section) {
        this.nodeI = nodeI;
        this.nodeJ = nodeJ;
        this.material = material;
        this.section = section;
        
        // Initial length
        const dx = nodeJ.x - nodeI.x;
        const dy = nodeJ.y - nodeI.y;
        this. L0 = Math.sqrt(dx * dx + dy * dy);
        
        // Plasticity model per integration point (2-point Gauss)
        this.plasticity = [
            new ChabochePlasticity(material),
            new ChabochePlasticity(material)
        ];
        
        // Internal forces in local frame
        this.N = 0;   // Axial
        this.M1 = 0;  // Moment at node I
        this. M2 = 0;  // Moment at node J
        this.V = 0;   // Shear
    }
    
    // Current length and orientation
    getGeometry() {
        const dx = this. nodeJ.x + this.nodeJ.u - (this.nodeI. x + this.nodeI.u);
        const dy = this.nodeJ.y + this.nodeJ.v - (this.nodeI.y + this.nodeI.v);
        const L = Math. sqrt(dx * dx + dy * dy);
        const cos_theta = dx / L;
        const sin_theta = dy / L;
        
        return { L, cos_theta, sin_theta, dx, dy };
    }
    
    // Transformation matrix (6x6 for 2D beam with 3 DOF per node)
    getTransformationMatrix() {
        const { cos_theta, sin_theta } = this.getGeometry();
        const T = Matrix.zeros(6, 6);
        
        // Node I
        T. set(0, 0, cos_theta);  T.set(0, 1, sin_theta);
        T.set(1, 0, -sin_theta); T.set(1, 1, cos_theta);
        T.set(2, 2, 1);
        
        // Node J
        T. set(3, 3, cos_theta);  T.set(3, 4, sin_theta);
        T.set(4, 3, -sin_theta); T.set(4, 4, cos_theta);
        T.set(5, 5, 1);
        
        return T;
    }
    
    // Local stiffness matrix (Euler-Bernoulli with shear correction optional)
    getLocalStiffness(includeShear = true) {
        const { L } = this.getGeometry();
        const E = this.material. E * 1e9;
        const G = this.material.G * 1e9;
        const A = this.section. A;
        const I = this.section.I;
        
        // Shear correction (Timoshenko)
        let phi = 0;
        if (includeShear && this.section.As) {
            phi = 12 * E * I / (G * this.section.As * L * L);
        }
        
        const factor = 1 / (1 + phi);
        
        const K = Matrix.zeros(6, 6);
        
        // Axial terms
        const EA_L = E * A / L;
        K.set(0, 0, EA_L);  K.set(0, 3, -EA_L);
        K.set(3, 0, -EA_L); K.set(3, 3, EA_L);
        
        // Bending terms
        const EI = E * I;
        const L2 = L * L;
        const L3 = L2 * L;
        
        const k11 = 12 * EI / L3 * factor;
        const k12 = 6 * EI / L2 * factor;
        const k22 = (4 + phi) * EI / L * factor;
        const k23 = (2 - phi) * EI / L * factor;
        
        K.set(1, 1, k11);   K.set(1, 2, k12);   K.set(1, 4, -k11);  K.set(1, 5, k12);
        K.set(2, 1, k12);   K.set(2, 2, k22);   K.set(2, 4, -k12);  K.set(2, 5, k23);
        K. set(4, 1, -k11);  K.set(4, 2, -k12);  K.set(4, 4, k11);   K.set(4, 5, -k12);
        K.set(5, 1, k12);   K.set(5, 2, k23);   K. set(5, 4, -k12);  K.set(5, 5, k22);
        
        return K;
    }
    
    // Global stiffness with geometric stiffness (for buckling)
    getGlobalStiffness(includeGeometric = true) {
        const T = this.getTransformationMatrix();
        const Kl = this.getLocalStiffness();
        
        // K_global = T' * K_local * T
        let K = T.transpose().multiply(Kl).multiply(T);
        
        if (includeGeometric && Math.abs(this. N) > 1e-6) {
            // Geometric stiffness matrix
            const { L } = this. getGeometry();
            const Kg = this.getGeometricStiffness(this.N, L);
            K = K.add(T.transpose().multiply(Kg).multiply(T));
        }
        
        return K;
    }
    
    // Geometric stiffness for stability analysis
    getGeometricStiffness(N, L) {
        const Kg = Matrix.zeros(6, 6);
        const factor = N / L;
        
        // Geometric stiffness terms
        const a = 6 / 5;
        const b = L / 10;
        const c = 2 * L * L / 15;
        const d = -L * L / 30;
        
        Kg.set(1, 1, a * factor);   Kg.set(1, 2, b * factor);
        Kg.set(1, 4, -a * factor);  Kg.set(1, 5, b * factor);
        Kg.set(2, 1, b * factor);   Kg.set(2, 2, c * factor);
        Kg. set(2, 4, -b * factor);  Kg.set(2, 5, d * factor);
        Kg.set(4, 1, -a * factor);  Kg.set(4, 2, -b * factor);
        Kg.set(4, 4, a * factor);   Kg.set(4, 5, -b * factor);
        Kg.set(5, 1, b * factor);   Kg.set(5, 2, d * factor);
        Kg.set(5, 4, -b * factor);  Kg.set(5, 5, c * factor);
        
        return Kg;
    }
    
    // Mass matrix (consistent)
    getMassMatrix() {
        const { L } = this. getGeometry();
        const rho = this.material.density;
        const A = this. section.A;
        const m = rho * A * L;
        
        const M = Matrix. zeros(6, 6);
        
        // Axial mass
        M. set(0, 0, m / 3);  M.set(0, 3, m / 6);
        M. set(3, 0, m / 6);  M. set(3, 3, m / 3);
        
        // Transverse mass (consistent)
        const L2 = L * L;
        M.set(1, 1, 13 * m / 35);      M.set(1, 2, 11 * m * L / 210);
        M. set(1, 4, 9 * m / 70);       M. set(1, 5, -13 * m * L / 420);
        M. set(2, 1, 11 * m * L / 210); M. set(2, 2, m * L2 / 105);
        M. set(2, 4, 13 * m * L / 420); M.set(2, 5, -m * L2 / 140);
        M. set(4, 1, 9 * m / 70);       M.set(4, 2, 13 * m * L / 420);
        M. set(4, 4, 13 * m / 35);      M.set(4, 5, -11 * m * L / 210);
        M.set(5, 1, -13 * m * L / 420); M.set(5, 2, -m * L2 / 140);
        M.set(5, 4, -11 * m * L / 210); M.set(5, 5, m * L2 / 105);
        
        const T = this.getTransformationMatrix();
        return T.transpose().multiply(M). multiply(T);
    }
    
    // Update internal forces from displacements
    updateInternalForces(temperature = 20) {
        const { L, cos_theta, sin_theta } = this.getGeometry();
        
        // Local displacements
        const u_local = [
            cos_theta * this.nodeI.u + sin_theta * this.nodeI.v,
            -sin_theta * this.nodeI. u + cos_theta * this.nodeI.v,
            this.nodeI.theta,
            cos_theta * this. nodeJ.u + sin_theta * this.nodeJ.v,
            -sin_theta * this. nodeJ.u + cos_theta * this.nodeJ.v,
            this. nodeJ.theta
        ];
        
        // Strains
        const epsilon_axial = (u_local[3] - u_local[0]) / L + 0.5 * Math.pow((u_local[4] - u_local[1]) / L, 2);
        const kappa1 = (u_local[5] - u_local[2]) / L;  // Simplified curvature
        const kappa2 = (4 * u_local[2] + 2 * u_local[5] - 6 * (u_local[4] - u_local[1]) / L) / L;
        
        // Gauss points
        const gaussPoints = [-0.577350269, 0.577350269];
        const gaussWeights = [1, 1];
        
        let N_int = 0, M_int = 0;
        
        for (let i = 0; i < 2; i++) {
            const xi = gaussPoints[i];
            const x = L * (1 + xi) / 2;
            
            // Strain at Gauss point
            const N1 = 1 - x / L;
            const N2 = x / L;
            const epsilon = epsilon_axial;
            const kappa = N1 * kappa2 + N2 * kappa1;
            
            // Fiber integration for section
            const fiberStrains = this.section.getFiberStrains(epsilon, kappa);
            
            let sigma_total = 0, moment_total = 0;
            for (const fiber of fiberStrains) {
                const result = this.plasticity[i].update(fiber.strain, temperature);
                sigma_total += result.stress * fiber.area;
                moment_total += result.stress * fiber.area * fiber.y;
            }
            
            N_int += sigma_total * gaussWeights[i] * L / 2;
            M_int += moment_total * gaussWeights[i] * L / 2;
        }
        
        this.N = N_int / L;
        this. M1 = M_int;
        this.M2 = M_int;
        this.V = (this.M1 + this. M2) / L;
        
        return { N: this.N, M1: this.M1, M2: this.M2, V: this.V };
    }
    
    // Internal force vector in global coordinates
    getInternalForceVector() {
        const { L, cos_theta, sin_theta } = this.getGeometry();
        
        const f_local = new Float64Array([
            -this.N,
            -this.V,
            -this.M1,
            this.N,
            this.V,
            this.M2
        ]);
        
        // Transform to global
        const T = this.getTransformationMatrix();
        return T.transpose().multiply(f_local);
    }
    
    // Stress recovery at any point along element
    getStress(xi, y) {
        const { L } = this.getGeometry();
        const x = L * (1 + xi) / 2;
        
        // Interpolate moment
        const M = (1 - x / L) * this. M1 + (x / L) * this.M2;
        
        // Bending stress
        const sigma_bending = M * y / this.section.I;
        
        // Axial stress
        const sigma_axial = this.N / this.section.A;
        
        return sigma_axial + sigma_bending;
    }
}

// ============================================================================
// SEZIONE TRASVERSALE PARAMETRICA
// ============================================================================
class BeamSection {
    constructor(params) {
        this.type = params.type || 'hollow_rect';
        this. W = params.width;       // Width (m)
        this. H = params.height;      // Height (m)
        this. t_v = params.t_v;       // Vertical wall thickness (m)
        this.t_h = params.t_h;       // Horizontal wall thickness (m)
        this.fillet = params.fillet || 0;
        this.ledGroove = params.ledGroove || false;
        this. grooveW = params.grooveW || 0.012;
        this. grooveH = params.grooveH || 0.008;
        
        this.calculate();
    }
    
    calculate() {
        const { W, H, t_v, t_h, fillet } = this;
        
        // Outer area and inertia
        let A_outer = W * H;
        let I_outer = W * Math.pow(H, 3) / 12;
        
        // Inner void
        const W_inner = Math.max(0, W - 2 * t_v);
        const H_inner = Math.max(0, H - 2 * t_h);
        let A_inner = W_inner * H_inner;
        let I_inner = W_inner * Math.pow(H_inner, 3) / 12;
        
        // Fillet correction (approximate)
        if (fillet > 0) {
            const fillet_area = (4 - Math.PI) * fillet * fillet;
            A_inner -= fillet_area;
            // Inertia correction simplified
            I_inner *= 0.98;
        }
        
        // LED groove
        if (this. ledGroove) {
            const groove_area = this.grooveW * this.grooveH;
            const groove_y = H / 2 - this.grooveH / 2;
            A_outer -= groove_area;
            I_outer -= groove_area * groove_y * groove_y + this.grooveW * Math.pow(this.grooveH, 3) / 12;
        }
        
        this.A = Math.max(1e-8, A_outer - A_inner);
        this.I = Math.max(1e-14, I_outer - I_inner);
        
        // Shear area (Timoshenko)
        this.As = this.A * 5 / 6;  // Approximate for hollow section
        
        // Section modulus
        this. S = this.I / (H / 2);
        
        // Torsion constant (approximate for hollow rect)
        const t_mean = (t_v + t_h) / 2;
        const b_mean = (W + H) / 2 - t_mean;
        this.J = 2 * t_mean * Math.pow(b_mean, 2) * Math.pow((W - t_v) * (H - t_h), 2) / 
                 ((W - t_v) + (H - t_h));
        
        // Generate fibers for integration
        this.fibers = this.generateFibers(10);
    }
    
    generateFibers(numFibers) {
        const fibers = [];
        const dy = this.H / numFibers;
        
        for (let i = 0; i < numFibers; i++) {
            const y = -this.H / 2 + dy / 2 + i * dy;
            const y_abs = Math.abs(y);
            
            let width;
            if (y_abs > this.H / 2 - this.t_h) {
                // In horizontal wall
                width = this.W;
            } else {
                // In vertical walls only
                width = 2 * this.t_v;
            }
            
            // LED groove reduction at top
            if (this. ledGroove && y > this.H / 2 - this.grooveH) {
                width = Math.max(0, width - this. grooveW);
            }
            
            fibers.push({
                y: y,
                area: width * dy,
                width: width
            });
        }
        
        return fibers;
    }
    
    getFiberStrains(epsilon_axial, kappa) {
        return this.fibers. map(fiber => ({
            y: fiber.y,
            area: fiber.area,
            strain: epsilon_axial - kappa * fiber.y
        }));
    }
}

// ============================================================================
// DATABASE FISSAGGI (Viti e Rivetti)
// ============================================================================
const FASTENERS_DB_V4 = {
    'none':      { diameter: 0, name: 'Nessuno (Solo Colla)' },
    'screw-m3':  { diameter: 3.2, name: 'Vite M3' },
    'screw-m4':  { diameter: 4.2, name: 'Vite M4' },
    'screw-m5':  { diameter: 5.2, name: 'Vite M5' },
    'screw-m6':  { diameter: 6.2, name: 'Vite M6' },
    'rivet-3':   { diameter: 3.2, name: 'Rivetto Ø3.2' },
    'rivet-4':   { diameter: 4.0, name: 'Rivetto Ø4.0' },
    'rivet-5':   { diameter: 4.8, name: 'Rivetto Ø4.8' },
    'rivet-6':   { diameter: 6.4, name: 'Rivetto Ø6.4' }
};

// ============================================================================
// SEZIONE TRASVERSALE CON FORI (Estende BeamSection)
// ============================================================================
class BeamSectionWithHoles extends BeamSection {
    constructor(params) {
        super(params);
        this.numHoles = params.numHoles || 0;
        this.holeDiameter_mm = params.holeDiameter_mm || 0;
        this.holeSpacing_mm = params.holeSpacing_mm || 50;   // Passo tra fori
        this.materialKey = params.materialKey || '6061-T6';
        this.notchRadius_mm = params.notchRadius_mm || 0.5;  // Raggio raccordo foro
        
        // Inizializza analisi avanzate
        this.holeAnalysis = null;
        this.netSection = null;
        this.bearingCheck = null;
        this.fatigueAnalysis = null;
        
        this.calculateWithHoles();
    }
    
    calculateWithHoles() {
        if (this.numHoles === 0 || this.holeDiameter_mm === 0) {
            this.areaReduction = 0;
            this.inertiaReduction = 0;
            this.Kt = 1.0;
            return;
        }
        
        const d_mm = this.holeDiameter_mm;
        const n = this.numHoles;
        const d_m = d_mm / 1000;
        
        // Calcolo riduzione area: ΔA = π × (d/2)² × n_fori
        const holeArea_m2 = Math.PI * Math.pow(d_m / 2, 2);
        this.areaReduction = holeArea_m2 * n;
        
        // Limite riduzione al 30% della parete superiore per evitare calcoli non fisici
        // (Standard ingegneristico: riduzione sezione > 30% richiede analisi più approfondita)
        const MAX_AREA_REDUCTION_RATIO = 0.3;
        const maxReduction = this.A * MAX_AREA_REDUCTION_RATIO;
        if (this.areaReduction > maxReduction) {
            this.areaReduction = maxReduction;
        }
        
        // Area ridotta
        this.A_effective = Math.max(1e-8, this.A - this.areaReduction);
        
        // Calcolo riduzione inerzia con teorema di Steiner: ΔI = A_foro × y_hole²
        // I fori sono sulla faccia superiore, quindi y_hole = H/2 - t_h/2
        const y_hole = (this.H / 2) - (this.t_h / 2);
        const inertiaHoleLocal = (Math.PI * Math.pow(d_m, 4)) / 64; // Inerzia locale del foro circolare
        const inertiaHoleSteiner = holeArea_m2 * Math.pow(y_hole, 2); // Contributo Steiner
        this.inertiaReduction = n * (inertiaHoleLocal + inertiaHoleSteiner);
        
        // Inerzia ridotta
        this.I_effective = Math.max(1e-14, this.I - this.inertiaReduction);
        
        // Fattore concentrazione tensione Kt: Kt = 3.0 - 3.14×(d/W) + 3.667×(d/W)² - 1.527×(d/W)³
        const W_mm = this.W * 1000;
        this.Kt = calculateKt(d_mm, W_mm);
    }
    
    /**
     * Esegue analisi avanzata completa dei fori
     * Integra HoleStressAnalysis, NetSectionAnalysis, BearingAnalysis, FatigueNotchAnalysis
     */
    performAdvancedAnalysis() {
        if (this.numHoles === 0 || this.holeDiameter_mm === 0) {
            return;
        }
        
        const W_mm = this.W * 1000;
        const t_mm = this.t_h * 1000;
        const y_hole_mm = ((this.H / 2) - (this.t_h / 2)) * 1000;
        
        // 1. Analisi concentrazione tensioni (Peterson/Frocht)
        this.holeAnalysis = new HoleStressAnalysis({
            d: this.holeDiameter_mm,
            p: this.holeSpacing_mm,
            t: t_mm,
            W: W_mm,
            n: this.numHoles,
            material: this.materialKey
        });
        
        // 2. Analisi sezione netta (EC9)
        this.netSection = new NetSectionAnalysis(this, {
            n: this.numHoles,
            d: this.holeDiameter_mm,
            y: y_hole_mm,
            t: t_mm
        });
        
        // 3. Analisi bearing (rifollamento) - Richiede dati fastener
        const material = MATERIALS_V4[this.materialKey];
        if (material) {
            this.bearingCheck = new BearingAnalysis(
                { diameter: this.holeDiameter_mm, f_ub: 400 },  // Bullone classe 4.6 default
                { thickness: t_mm, e1: 15, p1: this.holeSpacing_mm },
                material
            );
        }
        
        // 4. Analisi fatica (Peterson notch sensitivity)
        const Kt_eff = this.holeAnalysis.getEffectiveKt();
        this.fatigueAnalysis = new FatigueNotchAnalysis(
            this.materialKey,
            Kt_eff,
            this.notchRadius_mm
        );
    }
    
    /**
     * Restituisce risultati completi dell'analisi avanzata
     * @param {number} sigma_nominal - Tensione nominale (MPa) per calcoli locali
     * @param {number} appliedForcePerBolt - Forza per bullone (N) per verifica bearing
     * @returns {Object} Risultati completi analisi fori
     */
    getAdvancedResults(sigma_nominal = 0, appliedForcePerBolt = 0) {
        // Esegui analisi se non già fatta
        if (!this.holeAnalysis) {
            this.performAdvancedAnalysis();
        }
        
        const results = {
            // Proprietà base
            Kt_simple: this.Kt,
            A_net: this.A_effective,
            I_net: this.I_effective,
            
            // Risultati analisi avanzata
            Kt_effective: 1.0,
            Kf: 1.0,
            sigma_max_local: 0,
            bearing_utilization: 0,
            fatigue_safety_factor: Infinity,
            ec9_distances_ok: true
        };
        
        if (this.holeAnalysis) {
            results.Kt_effective = this.holeAnalysis.getEffectiveKt();
            results.sigma_max_local = this.holeAnalysis.getMaxLocalStress(sigma_nominal);
            results.ec9_distances = this.holeAnalysis.checkEC9Distances();
            results.ec9_distances_ok = results.ec9_distances.p1_ok;
        }
        
        if (this.netSection) {
            const netResults = this.netSection.calculateNetStress(0, 0);
            results.A_net = netResults.A_net;
            results.I_net = netResults.I_net;
            results.W_net = this.netSection.calculateNetSectionModulus();
        }
        
        if (this.bearingCheck && appliedForcePerBolt > 0) {
            const bearingResults = this.bearingCheck.checkBearing(appliedForcePerBolt);
            results.bearing_utilization = bearingResults.utilizationPercent;
            results.bearing_status = bearingResults.status;
            results.F_b_Rd = bearingResults.F_b_Rd;
        }
        
        if (this.fatigueAnalysis) {
            results.Kf = this.fatigueAnalysis.calculateKf();
            results.notch_sensitivity = this.fatigueAnalysis.calculateNotchSensitivity();
            
            // Calcolo fattore sicurezza fatica con tensione alternata stimata
            if (sigma_nominal > 0) {
                const fatigueResults = this.fatigueAnalysis.calculateFatigueSafetyFactor(
                    sigma_nominal * 0.3,  // Ampiezza stimata (30% della tensione massima)
                    sigma_nominal * 0.7   // Media stimata
                );
                results.fatigue_safety_factor = fatigueResults.safetyFactor;
                results.fatigue_status = fatigueResults.status;
            }
        }
        
        return results;
    }
    
    // Override per restituire proprietà ridotte
    getEffectiveArea() {
        return this.A_effective || this.A;
    }
    
    getEffectiveInertia() {
        return this.I_effective || this.I;
    }
    
    getStressConcentrationFactor() {
        return this.Kt || 1.0;
    }
}

// ============================================================================
// FUNZIONI DI SUPPORTO PER CALCOLO FORI
// ============================================================================

/**
 * Calcola la riduzione di area e inerzia per i fori
 * @param {Object} sectionParams - Parametri della sezione (H, W, t_h)
 * @param {number} numHoles - Numero di fori
 * @param {number} holeDiameter_mm - Diametro del foro in mm
 * @returns {Object} - { areaReduction_mm2, inertiaReduction_mm4 }
 */
function calculateHoleReduction(sectionParams, numHoles, holeDiameter_mm) {
    if (numHoles === 0 || holeDiameter_mm === 0) {
        return { areaReduction_mm2: 0, inertiaReduction_mm4: 0 };
    }
    
    const d = holeDiameter_mm; // mm
    const n = numHoles;
    const H_mm = sectionParams.H * 1000; // m -> mm
    const t_h_mm = sectionParams.t_h * 1000; // m -> mm
    
    // Area di un foro: π × (d/2)²
    const holeArea_mm2 = Math.PI * Math.pow(d / 2, 2);
    const totalAreaReduction_mm2 = holeArea_mm2 * n;
    
    // Posizione Y del foro (sulla faccia superiore)
    const y_hole_mm = (H_mm / 2) - (t_h_mm / 2);
    
    // Inerzia locale del foro: π × d⁴ / 64
    const inertiaHoleLocal_mm4 = (Math.PI * Math.pow(d, 4)) / 64;
    
    // Contributo Steiner: A × y²
    const inertiaHoleSteiner_mm4 = holeArea_mm2 * Math.pow(y_hole_mm, 2);
    
    // Riduzione totale inerzia
    const totalInertiaReduction_mm4 = n * (inertiaHoleLocal_mm4 + inertiaHoleSteiner_mm4);
    
    return {
        areaReduction_mm2: totalAreaReduction_mm2,
        inertiaReduction_mm4: totalInertiaReduction_mm4
    };
}

/**
 * Calcola il fattore di concentrazione delle tensioni Kt per foro in piastra
 * Formula: Kt = 3.0 - 3.14×(d/W) + 3.667×(d/W)² - 1.527×(d/W)³
 * (Formula di Peterson per piastra forata in trazione)
 * @param {number} d_mm - Diametro foro in mm
 * @param {number} W_mm - Larghezza sezione in mm
 * @returns {number} - Fattore Kt (>=1.0)
 */
function calculateKt(d_mm, W_mm) {
    if (W_mm <= 0 || d_mm <= 0) return 1.0;
    
    const ratio = d_mm / W_mm;
    
    // Limite rapporto d/W per validità formula (d/W > 0.5 non è fisicamente realistico)
    const MAX_RATIO = 0.5;
    const MAX_KT = 3.0; // Valore massimo Kt per foro in piastra infinita
    if (ratio >= MAX_RATIO) return MAX_KT;
    
    const Kt = 3.0 - 3.14 * ratio + 3.667 * Math.pow(ratio, 2) - 1.527 * Math.pow(ratio, 3);
    
    return Math.max(1.0, Kt);
}

/**
 * Calcola l'inerzia con fori applicati
 * @param {number} I_base - Inerzia base in m^4
 * @param {number} areaReduction_m2 - Riduzione area in m^2
 * @param {number} H_m - Altezza sezione in m
 * @param {number} t_h_m - Spessore orizzontale in m
 * @returns {number} - Inerzia ridotta in m^4
 */
function calculateInertiaWithHoles(I_base, areaReduction_m2, H_m, t_h_m) {
    if (areaReduction_m2 <= 0) return I_base;
    
    // Posizione Y del foro
    const y_hole = (H_m / 2) - (t_h_m / 2);
    
    // Contributo Steiner della riduzione
    const inertiaReduction = areaReduction_m2 * Math.pow(y_hole, 2);
    
    return Math.max(1e-14, I_base - inertiaReduction);
}

// ============================================================================
// ANALISI DI STABILITÀ (Buckling)
// ============================================================================
class StabilityAnalysis {
    constructor(elements, nodes, boundaryConditions) {
        this.elements = elements;
        this.nodes = nodes;
        this. bc = boundaryConditions;
    }
    
    // Linear buckling analysis
    linearBuckling(loadVector) {
        const ndof = this.nodes.length * 3;
        
        // Assemble stiffness matrices
        let K = Matrix.zeros(ndof, ndof);
        let Kg = Matrix.zeros(ndof, ndof);
        
        for (const elem of this.elements) {
            const Ke = elem.getLocalStiffness();
            const Kge = elem.getGeometricStiffness(1, elem.L0);  // Unit load
            
            // Assembly (simplified - assuming sequential DOFs)
            const dofs = this.getElementDOFs(elem);
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 6; j++) {
                    K. set(dofs[i], dofs[j], K.get(dofs[i], dofs[j]) + Ke.get(i, j));
                    Kg.set(dofs[i], dofs[j], Kg.get(dofs[i], dofs[j]) + Kge.get(i, j));
                }
            }
        }
        
        // Apply boundary conditions
        this.applyBoundaryConditions(K);
        this.applyBoundaryConditions(Kg);
        
        // Solve generalized eigenvalue problem: (K - λ*Kg)*φ = 0
        // Use inverse iteration
        const result = this.inverseIteration(K, Kg);
        
        return {
            criticalLoadFactor: result.eigenvalue,
            bucklingMode: result.eigenvector,
            converged: result.converged
        };
    }
    
    getElementDOFs(elem) {
        const iIdx = this.nodes.indexOf(elem. nodeI);
        const jIdx = this. nodes.indexOf(elem.nodeJ);
        return [
            iIdx * 3, iIdx * 3 + 1, iIdx * 3 + 2,
            jIdx * 3, jIdx * 3 + 1, jIdx * 3 + 2
        ];
    }
    
    applyBoundaryConditions(K) {
        for (const bc of this.bc) {
            const dof = bc.node * 3 + bc. dof;
            for (let i = 0; i < K.rows; i++) {
                K.set(dof, i, 0);
                K.set(i, dof, 0);
            }
            K.set(dof, dof, 1e15);
        }
    }
    
    inverseIteration(K, Kg, maxIter = 50, tol = 1e-8) {
        const n = K.rows;
        let v = new Float64Array(n);
        for (let i = 0; i < n; i++) v[i] = Math.random();
        
        // Normalize
        let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
        for (let i = 0; i < n; i++) v[i] /= norm;
        
        let lambda = 0;
        
        for (let iter = 0; iter < maxIter; iter++) {
            // Solve K * u = Kg * v
            const rhs = Kg. multiply(v);
            const u = K.solve(rhs);
            
            // Rayleigh quotient
            const vKgv = v.reduce((s, x, i) => s + x * rhs[i], 0);
            const uKgu = u.reduce((s, x, i) => s + x * Kg.multiply(u)[i], 0);
            const lambdaNew = vKgv / Math.max(1e-15, uKgu);
            
            // Normalize u
            norm = Math.sqrt(u.reduce((s, x) => s + x * x, 0));
            for (let i = 0; i < n; i++) v[i] = u[i] / Math.max(1e-15, norm);
            
            if (Math.abs(lambdaNew - lambda) < tol) {
                return { eigenvalue: 1 / lambdaNew, eigenvector: v, converged: true };
            }
            lambda = lambdaNew;
        }
        
        return { eigenvalue: 1 / lambda, eigenvector: v, converged: false };
    }
}

// ============================================================================
// ANALISI DINAMICA (Newmark-Beta / HHT-Alpha)
// ============================================================================
class DynamicAnalysis {
    constructor(elements, nodes, boundaryConditions) {
        this.elements = elements;
        this. nodes = nodes;
        this.bc = boundaryConditions;
        
        this.beta = FEM_V4_CONFIG.dynamics.beta;
        this.gamma = FEM_V4_CONFIG.dynamics.gamma;
        this.alpha = 0;  // HHT-alpha parameter (0 for Newmark)
    }
    
    // Modal analysis
    modalAnalysis(numModes = 5) {
        const ndof = this. nodes.length * 3;
        
        // Assemble K and M
        let K = Matrix.zeros(ndof, ndof);
        let M = Matrix.zeros(ndof, ndof);
        
        for (const elem of this. elements) {
            const Ke = elem.getGlobalStiffness(false);
            const Me = elem.getMassMatrix();
            
            const iIdx = this.nodes.indexOf(elem. nodeI);
            const jIdx = this.nodes.indexOf(elem.nodeJ);
            const dofs = [
                iIdx * 3, iIdx * 3 + 1, iIdx * 3 + 2,
                jIdx * 3, jIdx * 3 + 1, jIdx * 3 + 2
            ];
            
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 6; j++) {
                    K.set(dofs[i], dofs[j], K.get(dofs[i], dofs[j]) + Ke.get(i, j));
                    M.set(dofs[i], dofs[j], M.get(dofs[i], dofs[j]) + Me.get(i, j));
                }
            }
        }
        
        // Apply boundary conditions
        for (const bc of this.bc) {
            const dof = bc.node * 3 + bc. dof;
            for (let i = 0; i < ndof; i++) {
                K.set(dof, i, 0); K.set(i, dof, 0);
                M. set(dof, i, 0); M.set(i, dof, 0);
            }
            K.set(dof, dof, 1e15);
            M.set(dof, dof, 1e-15);
        }
        
        // Subspace iteration for multiple modes
        const modes = [];
        let K_shift = K;
        
        for (let mode = 0; mode < numModes; mode++) {
            const result = this.subspaceIteration(K_shift, M);
            if (! result.converged) break;
            
            const omega = Math.sqrt(Math.max(0, result.eigenvalue));
            const freq = omega / (2 * Math.PI);
            
            modes.push({
                frequency: freq,
                omega: omega,
                period: freq > 0 ? 1 / freq : Infinity,
                modeShape: result.eigenvector,
                effectiveMass: this.calculateEffectiveMass(M, result.eigenvector)
            });
            
            // Shift for next mode (deflation)
            const phi = result.eigenvector;
            const lambda = result.eigenvalue;
            for (let i = 0; i < ndof; i++) {
                for (let j = 0; j < ndof; j++) {
                    K_shift.set(i, j, K_shift.get(i, j) - lambda * phi[i] * phi[j]);
                }
            }
        }
        
        return modes;
    }
    
    subspaceIteration(K, M, maxIter = 100, tol = 1e-10) {
        const n = K.rows;
        let v = new Float64Array(n);
        for (let i = 0; i < n; i++) v[i] = Math.random();
        
        let lambda = 0;
        
        for (let iter = 0; iter < maxIter; iter++) {
            // Solve K * u = M * v
            const Mv = M.multiply(v);
            const u = K.solve(Mv);
            
            // Rayleigh quotient: λ = (v'Kv) / (v'Mv)
            const vKv = v.reduce((s, x, i) => s + x * K.multiply(v)[i], 0);
            const vMv = v. reduce((s, x, i) => s + x * Mv[i], 0);
            const lambdaNew = vKv / Math.max(1e-15, vMv);
            
            // M-normalize
            const uMu = u.reduce((s, x, i) => s + x * M.multiply(u)[i], 0);
            const norm = Math.sqrt(Math.max(1e-15, uMu));
            for (let i = 0; i < n; i++) v[i] = u[i] / norm;
            
            if (Math.abs(lambdaNew - lambda) / Math.max(1, Math.abs(lambda)) < tol) {
                return { eigenvalue: lambdaNew, eigenvector: v, converged: true };
            }
            lambda = lambdaNew;
        }
        
        return { eigenvalue: lambda, eigenvector: v, converged: false };
    }
    
    calculateEffectiveMass(M, phi) {
        const n = phi.length;
        let sum_phi_M = 0;
        let sum_M = 0;
        
        for (let i = 0; i < n; i += 3) {
            // Vertical DOF contribution
            const Mi = M.get(i + 1, i + 1);
            sum_phi_M += phi[i + 1] * Mi;
            sum_M += Mi;
        }
        
        return sum_M > 0 ? Math.pow(sum_phi_M, 2) / sum_M : 0;
    }
}

// ============================================================================
// MODULO ACCOPPIAMENTO SPALLA-PROFILO (Coupling Module)
// ============================================================================
// Analisi del collegamento tra spalla (inserto) e profilo (trave)
// Supporta tre meccanismi: Colla (Adhesive), Fissaggi (Fasteners), Ft (Friction/Manual)
// Basato su EN 1999-1-1 (EC9) per collegamenti in alluminio
// ============================================================================

/**
 * Costanti per l'analisi dell'accoppiamento
 */
const COUPLING_CONSTANTS = {
    // Coefficienti parziali di sicurezza (EN 1999-1-1)
    gamma_Ma: 1.50,    // Adesivi - fattore sicurezza
    gamma_Mf: 1.25,    // Fissaggi meccanici
    gamma_Mfr: 1.30,   // Attrito
    
    // Fattori di riduzione
    k_age: 0.80,       // Invecchiamento adesivo
    k_temp: 0.90,      // Temperatura (condizioni normali)
    k_humid: 0.85,     // Umidità
    
    // Rigidezza interfaccia (valori tipici)
    k_adhesive_base: 500,   // N/mm³ - rigidezza adesivo base
    k_fastener_base: 1000,  // N/mm - rigidezza fissaggio base
    
    // Slip ammissibile (mm)
    slip_limit_serviceability: 0.10,  // Limite di servizio
    slip_limit_ultimate: 0.50,         // Limite ultimo
    
    // Dimensioni minime zona adesiva (mm)
    min_overlap_length: 20,
    min_overlap_width: 10,
};

/**
 * Database adesivi strutturali per alluminio
 */
const ADHESIVES_DB = {
    'epoxy-2k': {
        name: 'Epossidico Bicomponente',
        tau_k: 15.0,       // Resistenza a taglio caratteristica (MPa)
        sigma_k: 20.0,     // Resistenza a trazione caratteristica (MPa)
        E_adhesive: 2500,  // Modulo elastico (MPa)
        G_adhesive: 900,   // Modulo di taglio (MPa)
        t_min: 0.1,        // Spessore minimo (mm)
        t_max: 0.5,        // Spessore massimo (mm)
        t_optimal: 0.2,    // Spessore ottimale (mm)
        temp_max: 80,      // Temperatura massima di esercizio (°C)
    },
    'methacrylate': {
        name: 'Metacrilato Strutturale',
        tau_k: 12.0,
        sigma_k: 18.0,
        E_adhesive: 1800,
        G_adhesive: 650,
        t_min: 0.2,
        t_max: 1.0,
        t_optimal: 0.5,
        temp_max: 100,
    },
    'polyurethane': {
        name: 'Poliuretano Elastico',
        tau_k: 5.0,
        sigma_k: 8.0,
        E_adhesive: 500,
        G_adhesive: 180,
        t_min: 0.5,
        t_max: 3.0,
        t_optimal: 1.5,
        temp_max: 70,
    },
    'silicone-structural': {
        name: 'Silicone Strutturale',
        tau_k: 1.5,
        sigma_k: 2.0,
        E_adhesive: 50,
        G_adhesive: 18,
        t_min: 3.0,
        t_max: 10.0,
        t_optimal: 6.0,
        temp_max: 150,
    },
    'acrylic-tape': {
        name: 'Nastro Acrilico VHB',
        tau_k: 0.8,
        sigma_k: 1.2,
        E_adhesive: 20,
        G_adhesive: 7,
        t_min: 0.5,
        t_max: 2.0,
        t_optimal: 1.1,
        temp_max: 90,
    },
};

/**
 * Classe InterfaceElement - Elemento di interfaccia per analisi locale
 * Rappresenta un elemento discreto dell'interfaccia spalla-profilo
 */
class InterfaceElement {
    /**
     * @param {Object} params - Parametri dell'elemento
     * @param {number} params.x - Posizione lungo l'interfaccia (mm)
     * @param {number} params.length - Lunghezza elemento (mm)
     * @param {number} params.width - Larghezza elemento (mm)
     * @param {number} params.k_local - Rigidezza locale (N/mm)
     */
    constructor(params) {
        this.x = params.x || 0;
        this.length = params.length || 10;
        this.width = params.width || 30;
        this.k_local = params.k_local || 1000;
        
        // Stato
        this.slip = 0;           // Scorrimento (mm)
        this.shear_force = 0;    // Forza di taglio (N)
        this.failed = false;     // Stato di rottura
    }
    
    /**
     * Calcola area dell'elemento
     * @returns {number} Area (mm²)
     */
    getArea() {
        return this.length * this.width;
    }
    
    /**
     * Aggiorna stato dell'elemento dato uno scorrimento imposto
     * @param {number} delta - Scorrimento (mm)
     * @returns {Object} Stato aggiornato
     */
    update(delta) {
        this.slip = delta;
        this.shear_force = this.k_local * delta;
        return {
            slip: this.slip,
            force: this.shear_force,
            failed: this.failed
        };
    }
}

/**
 * Classe CouplingAnalysis - Analisi completa dell'accoppiamento
 * Supporta combinazione libera di: Adhesive, Fasteners, Ft (friction/manual)
 */
class CouplingAnalysis {
    /**
     * @param {Object} params - Parametri geometrici
     * @param {number} params.overlap_length - Lunghezza sovrapposizione (mm)
     * @param {number} params.overlap_width - Larghezza sovrapposizione (mm)
     * @param {Object} params.beam_material - Materiale profilo
     * @param {Object} params.insert_material - Materiale spalla
     */
    constructor(params) {
        // Geometria
        this.overlap_length = params.overlap_length || 100;  // mm
        this.overlap_width = params.overlap_width || 30;     // mm
        
        // Materiali
        this.beam_material = params.beam_material || MATERIALS_V4['6061-T6'];
        this.insert_material = params.insert_material || MATERIALS_V4['46100-F'];
        
        // Configurazione metodi (tutti disabilitati di default)
        this.adhesive_enabled = false;
        this.fasteners_enabled = false;
        this.ft_enabled = false;  // Friction/Manual Ft
        
        // Parametri adesivo
        this.adhesive_type = 'epoxy-2k';
        this.adhesive_thickness = 0.2;  // mm
        
        // Parametri fissaggi
        this.fastener_type = 'screw-m4';
        this.fastener_count = 3;
        this.fastener_spacing = 50;  // mm
        
        // Parametro Ft manuale (forza tangenziale, N)
        this.ft_manual = 0;
        
        // Risultati
        this.results = null;
        this.interface_elements = [];
    }
    
    /**
     * Abilita/disabilita metodo adesivo
     * @param {boolean} enabled - Stato
     * @param {Object} options - Opzioni {type, thickness}
     */
    enableAdhesive(enabled, options = {}) {
        this.adhesive_enabled = enabled;
        if (options.type) this.adhesive_type = options.type;
        if (options.thickness) this.adhesive_thickness = options.thickness;
        return this;
    }
    
    /**
     * Abilita/disabilita metodo fissaggi
     * @param {boolean} enabled - Stato
     * @param {Object} options - Opzioni {type, count, spacing}
     */
    enableFasteners(enabled, options = {}) {
        this.fasteners_enabled = enabled;
        if (options.type) this.fastener_type = options.type;
        if (options.count) this.fastener_count = options.count;
        if (options.spacing) this.fastener_spacing = options.spacing;
        return this;
    }
    
    /**
     * Abilita/disabilita Ft manuale (friction/external force)
     * @param {boolean} enabled - Stato
     * @param {number} value - Valore Ft (N)
     */
    enableFt(enabled, value = 0) {
        this.ft_enabled = enabled;
        this.ft_manual = value;
        return this;
    }
    
    /**
     * Calcola resistenza adesivo: F_a,Rd
     * @returns {Object} {F_Rd, tau_d, A_eff, k_adhesive}
     */
    calculateAdhesiveResistance() {
        if (!this.adhesive_enabled) {
            return { F_Rd: 0, tau_d: 0, A_eff: 0, k_adhesive: 0 };
        }
        
        const adhesive = ADHESIVES_DB[this.adhesive_type];
        if (!adhesive) {
            return { F_Rd: 0, tau_d: 0, A_eff: 0, k_adhesive: 0 };
        }
        
        // Area effettiva (mm²)
        const A_eff = this.overlap_length * this.overlap_width;
        
        // Resistenza di progetto a taglio (MPa)
        // τ_d = τ_k × k_age × k_temp × k_humid / γ_Ma
        const tau_d = (adhesive.tau_k * 
                      COUPLING_CONSTANTS.k_age * 
                      COUPLING_CONSTANTS.k_temp * 
                      COUPLING_CONSTANTS.k_humid) / 
                      COUPLING_CONSTANTS.gamma_Ma;
        
        // Resistenza caratteristica (N)
        const F_Rd = tau_d * A_eff;
        
        // Rigidezza dell'adesivo (N/mm)
        // k = G × A / t
        const t = Math.max(adhesive.t_min, Math.min(adhesive.t_max, this.adhesive_thickness));
        const k_adhesive = (adhesive.G_adhesive * A_eff) / t;
        
        return {
            F_Rd: F_Rd,
            tau_d: tau_d,
            A_eff: A_eff,
            k_adhesive: k_adhesive,
            adhesive_name: adhesive.name
        };
    }
    
    /**
     * Calcola resistenza fissaggi: F_f,Rd
     * @returns {Object} {F_Rd, F_single, n_eff, k_fasteners}
     */
    calculateFastenersResistance() {
        if (!this.fasteners_enabled || this.fastener_count <= 0) {
            return { F_Rd: 0, F_single: 0, n_eff: 0, k_fasteners: 0 };
        }
        
        const fastener = FASTENERS_DB_V4[this.fastener_type];
        if (!fastener || fastener.diameter === 0) {
            return { F_Rd: 0, F_single: 0, n_eff: 0, k_fasteners: 0 };
        }
        
        const d = fastener.diameter;  // mm
        const n = this.fastener_count;
        
        // Resistenza a taglio di un fissaggio (formula semplificata)
        // Per viti: F_v,Rd ≈ 0.6 × f_ub × A_s / γ_Mf
        // Assumiamo f_ub = 400 MPa (classe 4.6) e A_s ≈ 0.7854 × d²
        const f_ub = 400;  // MPa
        const A_s = 0.7854 * d * d;  // mm²
        const F_v_single = (0.6 * f_ub * A_s) / COUPLING_CONSTANTS.gamma_Mf;
        
        // Numero efficace (riduzione per file multiple)
        // n_eff = min(n, 1 + 0.9×(n-1)) per fissaggi in linea
        const n_eff = Math.min(n, 1 + 0.9 * (n - 1));
        
        // Resistenza totale (N)
        const F_Rd = F_v_single * n_eff;
        
        // Rigidezza fissaggi (N/mm) - approssimata
        const k_fasteners = n * COUPLING_CONSTANTS.k_fastener_base * (d / 4);
        
        return {
            F_Rd: F_Rd,
            F_single: F_v_single,
            n_eff: n_eff,
            k_fasteners: k_fasteners,
            fastener_name: fastener.name
        };
    }
    
    /**
     * Calcola contributo Ft (attrito o forza manuale)
     * @returns {Object} {F_Rd, source}
     */
    calculateFtContribution() {
        if (!this.ft_enabled) {
            return { F_Rd: 0, source: 'disabled' };
        }
        
        // Ft manuale già definito dall'utente
        const F_Rd = this.ft_manual / COUPLING_CONSTANTS.gamma_Mfr;
        
        return {
            F_Rd: F_Rd,
            F_Ed: this.ft_manual,  // Forza di progetto (senza coefficiente)
            source: 'manual'
        };
    }
    
    /**
     * Calcola la rigidezza totale dell'interfaccia
     * @returns {number} k_interface (N/mm)
     */
    calculateInterfaceStiffness() {
        let k_total = 0;
        
        if (this.adhesive_enabled) {
            const adhesiveRes = this.calculateAdhesiveResistance();
            k_total += adhesiveRes.k_adhesive;
        }
        
        if (this.fasteners_enabled) {
            const fastenersRes = this.calculateFastenersResistance();
            k_total += fastenersRes.k_fasteners;
        }
        
        // Ft non contribuisce direttamente alla rigidezza elastica
        // ma può essere considerato come una forza di precarico
        
        return k_total;
    }
    
    /**
     * Calcola lo scorrimento dell'interfaccia dato un carico
     * @param {number} F_Ed - Forza applicata (N)
     * @returns {number} Scorrimento (mm)
     */
    calculateSlip(F_Ed) {
        const k_interface = this.calculateInterfaceStiffness();
        if (k_interface <= 0) return Infinity;
        
        // Sottrae il contributo Ft dalla forza (se attivo)
        let F_effective = F_Ed;
        if (this.ft_enabled) {
            F_effective = Math.max(0, F_Ed - this.ft_manual);
        }
        
        return F_effective / k_interface;
    }
    
    /**
     * Esegue analisi completa dell'accoppiamento
     * @param {number} F_Ed - Forza di progetto applicata (N)
     * @returns {Object} Risultati completi
     */
    analyze(F_Ed) {
        // Calcola contributi individuali
        const adhesiveRes = this.calculateAdhesiveResistance();
        const fastenersRes = this.calculateFastenersResistance();
        const ftRes = this.calculateFtContribution();
        
        // Resistenza totale (somma dei contributi)
        const F_Rd_total = adhesiveRes.F_Rd + fastenersRes.F_Rd + ftRes.F_Rd;
        
        // Rigidezza totale
        const k_interface = this.calculateInterfaceStiffness();
        
        // Scorrimento
        const slip = this.calculateSlip(F_Ed);
        
        // Utilizzo
        const utilization = F_Rd_total > 0 ? (F_Ed / F_Rd_total) : Infinity;
        
        // Fattore di sicurezza
        const safety_factor = F_Ed > 0 ? (F_Rd_total / F_Ed) : Infinity;
        
        // Status
        let status = 'OK';
        if (utilization > 1.0) {
            status = 'CRITICO';
        } else if (utilization > 0.9) {
            status = 'ATTENZIONE';
        } else if (utilization > 0.8) {
            status = 'VERIFICA';
        }
        
        // Verifica slip
        let slip_status = 'OK';
        if (slip > COUPLING_CONSTANTS.slip_limit_ultimate) {
            slip_status = 'CRITICO';
        } else if (slip > COUPLING_CONSTANTS.slip_limit_serviceability) {
            slip_status = 'ATTENZIONE';
        }
        
        this.results = {
            // Resistenze
            F_Rd_total: F_Rd_total,
            F_Rd_adhesive: adhesiveRes.F_Rd,
            F_Rd_fasteners: fastenersRes.F_Rd,
            F_Rd_ft: ftRes.F_Rd,
            
            // Contributi percentuali
            contribution_adhesive: F_Rd_total > 0 ? (adhesiveRes.F_Rd / F_Rd_total * 100) : 0,
            contribution_fasteners: F_Rd_total > 0 ? (fastenersRes.F_Rd / F_Rd_total * 100) : 0,
            contribution_ft: F_Rd_total > 0 ? (ftRes.F_Rd / F_Rd_total * 100) : 0,
            
            // Dettagli adesivo
            adhesive: adhesiveRes,
            
            // Dettagli fissaggi
            fasteners: fastenersRes,
            
            // Dettagli Ft
            ft: ftRes,
            
            // Rigidezza e scorrimento
            k_interface: k_interface,
            slip: slip,
            slip_status: slip_status,
            
            // Verifica
            F_Ed: F_Ed,
            utilization: utilization,
            utilization_percent: utilization * 100,
            safety_factor: safety_factor,
            status: status,
            
            // Metodi attivi
            methods_active: {
                adhesive: this.adhesive_enabled,
                fasteners: this.fasteners_enabled,
                ft: this.ft_enabled
            }
        };
        
        return this.results;
    }
    
    /**
     * Genera elementi di interfaccia per analisi locale
     * @param {number} num_elements - Numero di elementi
     * @returns {Array<InterfaceElement>} Array di elementi
     */
    generateInterfaceElements(num_elements = 10) {
        this.interface_elements = [];
        const dx = this.overlap_length / num_elements;
        const k_total = this.calculateInterfaceStiffness();
        const k_per_element = k_total / num_elements;
        
        for (let i = 0; i < num_elements; i++) {
            const elem = new InterfaceElement({
                x: i * dx + dx / 2,
                length: dx,
                width: this.overlap_width,
                k_local: k_per_element
            });
            this.interface_elements.push(elem);
        }
        
        return this.interface_elements;
    }
}

/**
 * Funzione helper per calcolo rapido delle forze di interfaccia
 * @param {Object} geometry - {overlap_length, overlap_width}
 * @param {Object} methods - {adhesive: {type, thickness}, fasteners: {type, count}, ft: value}
 * @param {number} F_Ed - Forza di progetto (N)
 * @returns {Object} Risultati analisi
 */
function calculateInterfaceForces(geometry, methods, F_Ed) {
    const analysis = new CouplingAnalysis({
        overlap_length: geometry.overlap_length,
        overlap_width: geometry.overlap_width
    });
    
    if (methods.adhesive) {
        analysis.enableAdhesive(true, methods.adhesive);
    }
    
    if (methods.fasteners) {
        analysis.enableFasteners(true, methods.fasteners);
    }
    
    if (methods.ft !== undefined && methods.ft > 0) {
        analysis.enableFt(true, methods.ft);
    }
    
    return analysis.analyze(F_Ed);
}

// ============================================================================
// ESPORTAZIONE GLOBALE (per uso in browser)
// ============================================================================
if (typeof window !== 'undefined') {
    window.HoleStressAnalysis = HoleStressAnalysis;
    window.NetSectionAnalysis = NetSectionAnalysis;
    window.BearingAnalysis = BearingAnalysis;
    window.FatigueNotchAnalysis = FatigueNotchAnalysis;
    window.AdvancedHoleFEM = AdvancedHoleFEM;
    window.BeamSection = BeamSection;
    window.BeamSectionWithHoles = BeamSectionWithHoles;
    window.MATERIALS_V4 = MATERIALS_V4;
    window.EC9_CONSTANTS = EC9_CONSTANTS;
    window.HOLE_ANALYSIS_CONSTANTS = HOLE_ANALYSIS_CONSTANTS;
    window.NOTCH_CONSTANTS = NOTCH_CONSTANTS;
    window.calculateKt = calculateKt;
    window.calculateHoleReduction = calculateHoleReduction;
    
    // Coupling module exports
    window.COUPLING_CONSTANTS = COUPLING_CONSTANTS;
    window.ADHESIVES_DB = ADHESIVES_DB;
    window.CouplingAnalysis = CouplingAnalysis;
    window.InterfaceElement = InterfaceElement;
    window.calculateInterfaceForces = calculateInterfaceForces;
}