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
    set(i, j, v) { this.data[i * this.cols + j] = v; }
    
    add(other) {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.data.length; i++) {
            result.data[i] = this.data[i] + other.data[i];
        }
        return result;
    }
    
    scale(s) {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.data.length; i++) {
            result.data[i] = this.data[i] * s;
        }
        return result;
    }
    
    multiply(other) {
        if (other instanceof Matrix) {
            const result = new Matrix(this.rows, other.cols);
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < other.cols; j++) {
                    let sum = 0;
                    for (let k = 0; k < this.cols; k++) {
                        sum += this.get(i, k) * other.get(k, j);
                    }
                    result.set(i, j, sum);
                }
            }
            return result;
        } else {
            // Vector multiplication
            const result = new Float64Array(this.rows);
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
                result.set(j, i, this.get(i, j));
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
                    sum += L.get(i, k) * L.get(j, k);
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
                sum -= L.get(i, j) * y[j];
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
            const Lii = L.get(i, i);
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
            const lambdaNew = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
            
            if (Math.abs(lambdaNew - lambda) < tol) {
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
// FATTORI DI RIDUZIONE TERMICA (EN 1999-1-2 Eurocodice 9)
// ============================================================================
class ThermalReductionFactors {
    // Tabella valori da EN 1999-1-2 (Eurocodice 9 - Progettazione al fuoco)
    // [T(°C), k_E (modulo elastico), k_yield (6xxx), k_yield (7xxx)]
    static temperatureTable = [
        [20,   1.000, 1.000, 1.000],
        [100,  0.980, 0.920, 0.900],
        [150,  0.965, 0.850, 0.780],
        [200,  0.940, 0.750, 0.650],
        [250,  0.900, 0.600, 0.500],
        [300,  0.850, 0.450, 0.350],
        [350,  0.750, 0.300, 0.200],
        [400,  0.600, 0.180, 0.100],
        [450,  0.450, 0.080, 0.050],
        [500,  0.300, 0.030, 0.020],
        [550,  0.150, 0.010, 0.005],
    ];
    
    /**
     * Interpolazione lineare tra punti della tabella
     * @param {number} T - Temperatura in °C
     * @param {number} columnIndex - Indice della colonna (1=E, 2=6xxx yield, 3=7xxx yield)
     * @returns {number} Fattore di riduzione interpolato
     */
    static interpolate(T, columnIndex) {
        const table = this.temperatureTable;
        
        // Clamp temperature to table range
        if (T <= table[0][0]) return table[0][columnIndex];
        if (T >= table[table.length - 1][0]) return table[table.length - 1][columnIndex];
        
        // Find surrounding points and interpolate
        for (let i = 0; i < table.length - 1; i++) {
            if (T >= table[i][0] && T <= table[i + 1][0]) {
                const T1 = table[i][0];
                const T2 = table[i + 1][0];
                const k1 = table[i][columnIndex];
                const k2 = table[i + 1][columnIndex];
                
                // Linear interpolation
                const factor = (T - T1) / (T2 - T1);
                return k1 + factor * (k2 - k1);
            }
        }
        
        return 1.0; // Default fallback
    }
    
    /**
     * Fattore di riduzione per modulo elastico E
     * @param {number} T - Temperatura in °C
     * @returns {number} Fattore k_E
     */
    static getE_factor(T) {
        return this.interpolate(T, 1);
    }
    
    /**
     * Fattore di riduzione per tensione di snervamento
     * @param {number} T - Temperatura in °C
     * @param {string} alloyType - Tipo lega ('6xxx', '7xxx', '2xxx', 'cast')
     * @returns {number} Fattore k_yield
     */
    static getYield_factor(T, alloyType = '6xxx') {
        // 7xxx e 2xxx si degradano più velocemente
        if (alloyType === '7xxx' || alloyType === '2xxx') {
            return this.interpolate(T, 3);
        }
        // 6xxx e cast alloys
        return this.interpolate(T, 2);
    }
    
    /**
     * Fattore di riduzione per modulo di taglio G
     * Il modulo G si riduce in modo simile a E
     * @param {number} T - Temperatura in °C
     * @returns {number} Fattore k_G
     */
    static getG_factor(T) {
        return this.getE_factor(T);
    }
    
    /**
     * Coefficiente di espansione termica variabile con temperatura
     * L'espansione termica aumenta con la temperatura
     * @param {number} alpha_20 - Coefficiente a 20°C (1/K)
     * @param {number} T - Temperatura in °C
     * @returns {number} Coefficiente di espansione termica (1/K)
     */
    static getAlpha(alpha_20, T) {
        // L'espansione termica aumenta linearmente di circa 10% ogni 100°C
        const factor = 1 + 0.001 * Math.max(0, T - 20);
        return alpha_20 * factor;
    }
    
    /**
     * Conducibilità termica variabile con temperatura
     * La conducibilità diminuisce leggermente con T
     * @param {number} k_20 - Conducibilità a 20°C (W/m·K)
     * @param {number} T - Temperatura in °C
     * @returns {number} Conducibilità termica (W/m·K)
     */
    static getThermalConductivity(k_20, T) {
        // Leggera diminuzione con la temperatura (circa -0.02% per °C)
        const factor = Math.max(0.85, 1 - 0.0002 * Math.max(0, T - 20));
        return k_20 * factor;
    }
    
    /**
     * Calore specifico variabile con temperatura
     * Il calore specifico aumenta con la temperatura
     * @param {number} Cp_20 - Calore specifico a 20°C (J/kg·K)
     * @param {number} T - Temperatura in °C
     * @returns {number} Calore specifico (J/kg·K)
     */
    static getSpecificHeat(Cp_20, T) {
        // Aumento circa lineare del calore specifico
        // Basato su dati ASM Handbook Vol. 2
        const factor = 1 + 0.0003 * Math.max(0, T - 20);
        return Cp_20 * factor;
    }
}

/**
 * Determina il tipo di lega dal nome del materiale
 * @param {string} materialName - Nome del materiale
 * @returns {string} Tipo lega ('6xxx', '7xxx', '2xxx', 'cast', 'other')
 */
function getAlloyType(materialName) {
    if (!materialName || typeof materialName !== 'string') {
        return '6xxx'; // Default
    }
    
    const name = materialName.toUpperCase();
    
    // Cast alloys first (EN AB 4xxxx, Zamak) - check before 6xxx due to overlap
    if (name.includes('EN AB') || name.includes('ZAMAK') || /4[0-9]{4}/.test(name)) {
        return 'cast';
    }
    
    // Serie 7xxx (es. 7075, Ergal)
    if (/70\d\d/.test(name) || name.includes('ERGAL')) {
        return '7xxx';
    }
    
    // Serie 2xxx (es. 2024, Avional)
    if (/20\d\d/.test(name) || name.includes('AVIONAL')) {
        return '2xxx';
    }
    
    // Serie 6xxx (es. 6060, 6061, 6082, 6063)
    if (/60\d\d/.test(name) || /6\d\d\d/.test(name)) {
        return '6xxx';
    }
    
    return '6xxx'; // Default to 6xxx
}

// ============================================================================
// MODELLO COSTITUTIVO: Plasticità Combinata Isotropa-Cinematica (Chaboche)
// ============================================================================
class ChabochePlasticity {
    constructor(material) {
        this.E = material.E * 1e9;
        this.sigma_y0 = material.yield * 1e6;
        this.Q_inf = (material.Q_inf || 50) * 1e6;
        this.b = material.b_iso || 10;
        this.C = (material.C_kin || 15000) * 1e6;
        this.gamma = material.gamma_kin || 100;
        
        // Store material name for alloy type identification
        this.materialName = material.name || '';
        this.alloyType = getAlloyType(this.materialName);
        
        // State variables
        this.epsilon_p = 0;          // Plastic strain
        this.alpha = 0;              // Backstress (kinematic)
        this.r = 0;                  // Isotropic hardening variable
        this.damage = 0;             // Damage variable (Lemaitre)
        
        // Damage parameters
        this.S_damage = material.S_damage || 3;
        this.s_damage = material.s_damage || 1;
        this.epsilon_D = material.epsilon_D || 0.03;
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
    // Uses EN 1999-1-2 (Eurocodice 9) thermal reduction factors
    update(epsilon_total, temperature = 20) {
        // Temperature correction using EN 1999-1-2 reduction factors
        const k_E = ThermalReductionFactors.getE_factor(temperature);
        const k_yield = ThermalReductionFactors.getYield_factor(temperature, this.alloyType);
        
        // Apply thermal reduction to material properties
        const E_T = this.E * k_E;
        const sigma_y_T = this.sigma_y0 * k_yield;
        
        // Reduce Q_inf and C with temperature (plastic parameters)
        // These follow similar trends to yield strength
        const Q_inf_T = this.Q_inf * k_yield;
        const C_T = this.C * k_yield;
        
        // Trial stress
        const epsilon_e_trial = epsilon_total - this.epsilon_p;
        const sigma_trial = E_T * epsilon_e_trial * (1 - this.damage);
        
        // Check yield
        const R = this.isotropicHardening(this.r);
        const f_trial = this.yieldFunction(sigma_trial, this.alpha, R * k_yield);
        
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
            const R_new = Q_inf_T * (1 - Math.exp(-this.b * (this.r + delta_gamma)));
            const alpha_new = this.alpha + C_T / this.gamma * (1 - Math.exp(-this.gamma * delta_gamma)) * sign_stress;
            
            const sigma_new = sigma_trial - E_T * delta_gamma * sign_stress * (1 - this.damage);
            const f = Math.abs(sigma_new - alpha_new) - (sigma_y_T + R_new);
            
            if (Math.abs(f) < 1e-10) break;
            
            // Derivative
            const df_dgamma = -E_T * (1 - this.damage) - C_T * Math.exp(-this.gamma * delta_gamma) - Q_inf_T * this.b * Math.exp(-this.b * (this.r + delta_gamma));
            delta_gamma -= f / df_dgamma;
            delta_gamma = Math.max(0, delta_gamma);
        }
        
        // Update state
        this.epsilon_p += delta_gamma * sign_stress;
        this.alpha += C_T / this.gamma * (1 - Math.exp(-this.gamma * delta_gamma)) * sign_stress;
        this.r += delta_gamma;
        
        // Damage evolution (Lemaitre)
        if (this.r > this.epsilon_D) {
            const Y = 0.5 * sigma_trial * sigma_trial / E_T;  // Energy release rate
            const damage_increment = Math.pow(Y / this.S_damage, this.s_damage) * delta_gamma;
            this.damage = Math.min(0.99, this.damage + damage_increment);
        }
        
        const sigma_final = (sigma_trial - E_T * delta_gamma * sign_stress) * (1 - this.damage);
        
        // Consistent tangent modulus
        const H_iso = Q_inf_T * this.b * Math.exp(-this.b * this.r);
        const H_kin = C_T * Math.exp(-this.gamma * delta_gamma);
        const E_tan = E_T * (H_iso + H_kin) / (E_T + H_iso + H_kin) * (1 - this.damage);
        
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
        this.damage = 0;
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
        this.L0 = Math.sqrt(dx * dx + dy * dy);
        
        // Plasticity model per integration point (2-point Gauss)
        this.plasticity = [
            new ChabochePlasticity(material),
            new ChabochePlasticity(material)
        ];
        
        // Internal forces in local frame
        this.N = 0;   // Axial
        this.M1 = 0;  // Moment at node I
        this.M2 = 0;  // Moment at node J
        this.V = 0;   // Shear
    }
    
    // Current length and orientation
    getGeometry() {
        const dx = this.nodeJ.x + this.nodeJ.u - (this.nodeI.x + this.nodeI.u);
        const dy = this.nodeJ.y + this.nodeJ.v - (this.nodeI.y + this.nodeI.v);
        const L = Math.sqrt(dx * dx + dy * dy);
        const cos_theta = dx / L;
        const sin_theta = dy / L;
        
        return { L, cos_theta, sin_theta, dx, dy };
    }
    
    // Transformation matrix (6x6 for 2D beam with 3 DOF per node)
    getTransformationMatrix() {
        const { cos_theta, sin_theta } = this.getGeometry();
        const T = Matrix.zeros(6, 6);
        
        // Node I
        T.set(0, 0, cos_theta);  T.set(0, 1, sin_theta);
        T.set(1, 0, -sin_theta); T.set(1, 1, cos_theta);
        T.set(2, 2, 1);
        
        // Node J
        T.set(3, 3, cos_theta);  T.set(3, 4, sin_theta);
        T.set(4, 3, -sin_theta); T.set(4, 4, cos_theta);
        T.set(5, 5, 1);
        
        return T;
    }
    
    // Local stiffness matrix (Euler-Bernoulli with shear correction optional)
    getLocalStiffness(includeShear = true) {
        const { L } = this.getGeometry();
        const E = this.material.E * 1e9;
        const G = this.material.G * 1e9;
        const A = this.section.A;
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
        K.set(4, 1, -k11);  K.set(4, 2, -k12);  K.set(4, 4, k11);   K.set(4, 5, -k12);
        K.set(5, 1, k12);   K.set(5, 2, k23);   K.set(5, 4, -k12);  K.set(5, 5, k22);
        
        return K;
    }
    
    // Global stiffness with geometric stiffness (for buckling)
    getGlobalStiffness(includeGeometric = true) {
        const T = this.getTransformationMatrix();
        const Kl = this.getLocalStiffness();
        
        // K_global = T' * K_local * T
        let K = T.transpose().multiply(Kl).multiply(T);
        
        if (includeGeometric && Math.abs(this.N) > 1e-6) {
            // Geometric stiffness matrix
            const { L } = this.getGeometry();
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
        Kg.set(2, 4, -b * factor);  Kg.set(2, 5, d * factor);
        Kg.set(4, 1, -a * factor);  Kg.set(4, 2, -b * factor);
        Kg.set(4, 4, a * factor);   Kg.set(4, 5, -b * factor);
        Kg.set(5, 1, b * factor);   Kg.set(5, 2, d * factor);
        Kg.set(5, 4, -b * factor);  Kg.set(5, 5, c * factor);
        
        return Kg;
    }
    
    // Mass matrix (consistent)
    getMassMatrix() {
        const { L } = this.getGeometry();
        const rho = this.material.density;
        const A = this.section.A;
        const m = rho * A * L;
        
        const M = Matrix.zeros(6, 6);
        
        // Axial mass
        M.set(0, 0, m / 3);  M.set(0, 3, m / 6);
        M.set(3, 0, m / 6);  M.set(3, 3, m / 3);
        
        // Transverse mass (consistent)
        const L2 = L * L;
        M.set(1, 1, 13 * m / 35);      M.set(1, 2, 11 * m * L / 210);
        M.set(1, 4, 9 * m / 70);       M.set(1, 5, -13 * m * L / 420);
        M.set(2, 1, 11 * m * L / 210); M.set(2, 2, m * L2 / 105);
        M.set(2, 4, 13 * m * L / 420); M.set(2, 5, -m * L2 / 140);
        M.set(4, 1, 9 * m / 70);       M.set(4, 2, 13 * m * L / 420);
        M.set(4, 4, 13 * m / 35);      M.set(4, 5, -11 * m * L / 210);
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
            -sin_theta * this.nodeI.u + cos_theta * this.nodeI.v,
            this.nodeI.theta,
            cos_theta * this.nodeJ.u + sin_theta * this.nodeJ.v,
            -sin_theta * this.nodeJ.u + cos_theta * this.nodeJ.v,
            this.nodeJ.theta
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
        this.M1 = M_int;
        this.M2 = M_int;
        this.V = (this.M1 + this.M2) / L;
        
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
        const M = (1 - x / L) * this.M1 + (x / L) * this.M2;
        
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
        this.W = params.width;       // Width (m)
        this.H = params.height;      // Height (m)
        this.t_v = params.t_v;       // Vertical wall thickness (m)
        this.t_h = params.t_h;       // Horizontal wall thickness (m)
        this.fillet = params.fillet || 0;
        this.ledGroove = params.ledGroove || false;
        this.grooveW = params.grooveW || 0.012;
        this.grooveH = params.grooveH || 0.008;
        
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
        if (this.ledGroove) {
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
        this.S = this.I / (H / 2);
        
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
            if (this.ledGroove && y > this.H / 2 - this.grooveH) {
                width = Math.max(0, width - this.grooveW);
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
        return this.fibers.map(fiber => ({
            y: fiber.y,
            area: fiber.area,
            strain: epsilon_axial - kappa * fiber.y
        }));
    }
}

// ============================================================================
// ANALISI DI STABILITÀ (Buckling)
// ============================================================================
class StabilityAnalysis {
    constructor(elements, nodes, boundaryConditions) {
        this.elements = elements;
        this.nodes = nodes;
        this.bc = boundaryConditions;
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
                    K.set(dofs[i], dofs[j], K.get(dofs[i], dofs[j]) + Ke.get(i, j));
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
        const iIdx = this.nodes.indexOf(elem.nodeI);
        const jIdx = this.nodes.indexOf(elem.nodeJ);
        return [
            iIdx * 3, iIdx * 3 + 1, iIdx * 3 + 2,
            jIdx * 3, jIdx * 3 + 1, jIdx * 3 + 2
        ];
    }
    
    applyBoundaryConditions(K) {
        for (const bc of this.bc) {
            const dof = bc.node * 3 + bc.dof;
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
            const rhs = Kg.multiply(v);
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
        this.nodes = nodes;
        this.bc = boundaryConditions;
        
        this.beta = FEM_V4_CONFIG.dynamics.beta;
        this.gamma = FEM_V4_CONFIG.dynamics.gamma;
        this.alpha = 0;  // HHT-alpha parameter (0 for Newmark)
    }
    
    // Modal analysis
    modalAnalysis(numModes = 5) {
        const ndof = this.nodes.length * 3;
        
        // Assemble K and M
        let K = Matrix.zeros(ndof, ndof);
        let M = Matrix.zeros(ndof, ndof);
        
        for (const elem of this.elements) {
            const Ke = elem.getGlobalStiffness(false);
            const Me = elem.getMassMatrix();
            
            const iIdx = this.nodes.indexOf(elem.nodeI);
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
            const dof = bc.node * 3 + bc.dof;
            for (let i = 0; i < ndof; i++) {
                K.set(dof, i, 0); K.set(i, dof, 0);
                M.set(dof, i, 0); M.set(i, dof, 0);
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
            const vMv = v.reduce((s, x, i) => s + x * Mv[i], 0);
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

