# Simulatore Gibus
Simulatore FEM per bracci estensibili tende da sole

## 🆕 Novità Versione 4.1

### Import Profili SVG & Integrazione FEM
- ✅ **Validazione SVG automatica** per compatibilità FEM
- ✅ **Classe `SVGProfileImporter`** per conversione diretta SVG → FEM
- ✅ **Test Suite completa** con 14+ test automatizzati
- ✅ **File SVG di esempio** per testing immediato

### Caratteristiche Principali
- Importazione profili/spalle da file SVG
- Validazione geometrica automatica (chiusura contorni, auto-intersezioni, complessità)
- Export JSON ottimizzato per analisi FEM
- Integrazione seamless con fem_engine_v4.js
- Database materiali esteso (18+ leghe alluminio)
- Analisi avanzata fori (Peterson, EC9, fatica)

## 🚀 Quick Start

### 1. Import SVG → FEM
```bash
# Apri import_000.html
# Carica file SVG profilo
# Esporta JSON per FEM
# Usa in index.html con SVGProfileImporter
```

### 2. Esegui Test
```bash
# Apri test_suite.html
# Click "Esegui Tutti i Test"
# Verifica: 14/14 test superati ✅
```

### 3. Esempi Completi
Vedi `ESEMPI_UTILIZZO.md` per 6 esempi dettagliati:
- Esempio 0: **Import Profili SVG** [NUOVO]
- Esempio 1: Analisi Dinamica
- Esempio 2: Raffinamento Mesh Locale
- Esempio 3: Import SVG → Export FEM
- Esempio 4: Analisi Fori Avanzata
- Esempio 5: Confronto Materiali
- Esempio 6: **Test Suite** [NUOVO]

## 📁 Struttura Repository

```
simulatore-gibus/
├── fem_engine_v4.js          # Motore FEM (con SVGProfileImporter)
├── import_000.html            # Editor SVG + Validazione
├── index.html                 # Applicazione simulatore
├── test_suite.html            # Test automatizzati [NUOVO]
├── ESEMPI_UTILIZZO.md         # Documentazione esempi
├── test_simple_rect.svg       # File test SVG [NUOVO]
├── test_c_profile_with_holes.svg  [NUOVO]
└── test_complex_multichamber.svg  [NUOVO]
```

## 🔧 Funzionalità Tecniche

### SVG Validation Module
- Verifica chiusura contorni (tolleranza < 1mm)
- Rilevamento auto-intersezioni
- Controllo complessità (max 5000 punti)
- Validazione dimensioni e area
- Report dettagliato errori/warning

### SVGProfileImporter Class
```javascript
const importer = new SVGProfileImporter();
const section = importer.createSectionFromImport(jsonData);
// Sezione FEM pronta!
```

### Mapping Materiali
- 18 leghe alluminio supportate
- Fallback automatico per materiali non standard
- Validazione compatibilità MATERIALS_V4

## 📊 Test Coverage

| Categoria | Test | Status |
|-----------|------|--------|
| Validazione SVG | 4 | ✅ |
| Import Sezioni | 4 | ✅ |
| Integrazione FEM | 5 | ✅ |
| Ottimizzazione | 2 | ✅ |
| **Totale** | **14** | **100%** |

## 🎓 Documentazione

- **ESEMPI_UTILIZZO.md**: 6 esempi pratici passo-passo
- **import_000.html**: Documentazione interattiva integrata
- **test_suite.html**: Test con esempi di codice

## 🔗 Link Utili

- GitHub: https://github.com/vannizanotto/simulatore-gibus
- Autore: Vanni Zanotto
- Licenza: Vedi repository

---

**Versione:** 4.1  
**Ultima Modifica:** 15 Dicembre 2025

